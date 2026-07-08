import { xvsInstance } from '../main.js'
import { TALLY_CODES, tallyKey } from '../constants.js'

// Decode a pushed/read Serial Tally message (protocol §13).
//
// Layout: [count, 0x24, code, 0xFF, status..., data...]
//   - code      : identifies the tally group + color + data size (see TALLY_CODES)
//   - status    : 2 bytes for 128-bit mode, 4 bytes for 256-bit mode (compress status)
//   - data      : one byte per set status bit, in order status[0]..status[last], bit7..bit0
//
// Each status bit represents an 8-source block. A set bit means a data byte for that block
// follows; within a data byte, bit k corresponds to (blockBase + k). The status bytes run
// from the highest source range to the lowest, so the first status byte covers the top 64
// sources. Each message carries the complete tally list for one (group, color) pair.
export function INCOMING_TALLY(self: xvsInstance, buffer: Buffer): boolean {
	if (buffer.readUInt8(1) !== 0x24) {
		return false
	}

	const code = TALLY_CODES[buffer.readUInt8(2)]
	if (!code) {
		return false
	}

	if (buffer.readUInt8(3) !== 0xff) {
		return false
	}

	const numStatus = code.size === 256 ? 4 : 2
	const statusStart = 4
	const dataStart = statusStart + numStatus

	// Need at least the status bytes present
	if (buffer.length < dataStart) {
		return false
	}

	const tallied = new Set<number>()
	let dataIndex = dataStart

	for (let p = 0; p < numStatus; p++) {
		const statusByte = buffer.readUInt8(statusStart + p)
		// first status byte covers the highest 64-source block
		const rangeBase = (numStatus - 1 - p) * 64 + 1

		for (let bit = 7; bit >= 0; bit--) {
			if ((statusByte & (1 << bit)) === 0) {
				continue
			}

			if (dataIndex >= buffer.length) {
				// malformed / truncated message, stop consuming
				break
			}

			const dataByte = buffer.readUInt8(dataIndex)
			dataIndex++

			const blockBase = rangeBase + bit * 8
			for (let k = 0; k < 8; k++) {
				if (dataByte & (1 << k)) {
					tallied.add(blockBase + k)
				}
			}
		}
	}

	// Each message is the full state for this group/color, so replace it wholesale.
	self.DATA.tally[tallyKey(code.group, code.color)] = tallied

	//tally data is latency-critical, update immediately without debounce
	self.updateVariableValues()
	self.checkFeedbacks('tallySource')

	return true
}
