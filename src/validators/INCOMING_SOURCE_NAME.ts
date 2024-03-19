import { xvsInstance } from '../main.js'
import { SOURCES } from '../constants.js'

export function INCOMING_SOURCE_NAME(self: xvsInstance, buffer: Buffer): boolean {
	const len = buffer.readUint8(0)
	if (len < 5 || len > 16 + 5) {
		console.log('ughhhg', buffer, len)
		return false
	}

	if (buffer.readUint8(1) !== 0x20) {
		return false
	}

	if (buffer.readUint8(2) !== 0xf0) {
		return false
	}

	if (buffer.readUint8(3) !== 0x50) {
		return false
	}

	const data1 = buffer.readUInt8(4)
	const data2 = buffer.readUInt8(5)

	const found = SOURCES[self.config.model].find((obj) => obj.byte1 === data1 && obj.byte2 === data2)

	if (!found) {
		self.log('error', 'INCOMING SOURCE NAME - NO SOURCE MATCH')
		console.log('INCOMING SOURCE NAME - NO SOURCE MATCH')
	}

	const name = buffer.subarray(6, len + 1).toString()
	if (buffer.readUInt8(6) == 0xff) {
		//we know what this is, it's just not worth doing anything with, so we don't return false.
		//return false
	} else {
		// TODO: Handle feedbacks/variables for SOURCE NAME
		console.log('INCOMING: SOURCE NAME:', found, name)
	}
	return true
}
