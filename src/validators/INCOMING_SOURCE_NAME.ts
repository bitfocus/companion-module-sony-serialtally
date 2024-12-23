import { xvsInstance } from '../main.js'
import { SOURCES } from '../constants.js'

export function INCOMING_SOURCE_NAME(self: xvsInstance, buffer: Buffer): boolean {
	const len = buffer.readUint8(0)

	if (len < 5) {
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

	if (len > 16 + 5) {
		console.log('ughhhg', 'text too long or something.')
		return false
	}

	const data1 = buffer.readUInt8(4)
	const data2 = buffer.readUInt8(5)

	const found = SOURCES[self.config.model].find((obj) => obj.byte1 === data1 && obj.byte2 === data2)

	if (!found) {
		self.log('error', 'INCOMING SOURCE NAME - NO SOURCE MATCH')
		console.log('INCOMING SOURCE NAME - NO SOURCE MATCH')
		return false
	}

	let name = ''

	// If length is 5, it was empty
	if (len >= 6) {
		// 0xff is also empty, or restricted or something
		if (buffer.readUInt8(6) != 0xff) {
			name = buffer.subarray(6, len + 1).toString()
		}
	}

	//search the self.sourceNames array for the source name based on the found id, if it's not there, add it.
	const foundSource = self.DATA.sourceNames.find((obj: { id: number }) => obj.id === found?.id)
	if (!foundSource) {
		self.DATA.sourceNames.push({ id: found?.id, name: name })
	} else {
		foundSource.name = name
	}

	//console.log('INCOMING SOURCE NAME:', found, name)

	//start a timer to update actions with the sourceNames array - we only want to do it after we haven't had any new source name data for 1 second.
	if (self.sourceNameUpdateTimer) {
		clearTimeout(self.sourceNameUpdateTimer)
	}

	self.sourceNameUpdateTimer = setTimeout(() => {
		self.updateActions()
		self.updateFeedbacks()
		self.updateVariableValues()
		delete self.sourceNameUpdateTimer
	}, self.INTERVAL_RATE)

	return true
}
