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
		self.log('debug', 'INCOMING SOURCE NAME - text too long or something.')
		return false
	}

	const data1 = buffer.readUInt8(4)
	const data2 = buffer.readUInt8(5)

	const found = SOURCES[self.config.model].find((obj) => obj.byte1 === data1 && obj.byte2 === data2)

	if (!found) {
		self.log('error', 'INCOMING SOURCE NAME - NO SOURCE MATCH')
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

	// If we recently wrote a new name for this source, check whether this
	// incoming response is stale
	const pending = self.pendingSourceNameWrites.get(found.id)
	if (pending) {
		if (Date.now() < pending.expiresAt) {
			// Guard is still active — only accept if the name matches what we wrote
			if (name !== pending.name) {
				self.logVerbose(
					`INCOMING SOURCE NAME: ignoring stale name "${name}" for source ${found.id} (pending write: "${pending.name}")`,
				)
				return true // consumed the message, but don't update cache
			}
		} else {
			// Guard expired, clean it up
			self.pendingSourceNameWrites.delete(found.id)
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
		self.updatePresets()
		self.updateVariableValues()
		delete self.sourceNameUpdateTimer
	}, self.INTERVAL_RATE)

	return true
}
