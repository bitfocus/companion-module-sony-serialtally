import { xvsInstance } from '../main.js'
import { FMXPTEffectAddresses, SOURCES } from '../constants.js'

export function INCOMING_FM_XPT(self: xvsInstance, buffer: Buffer): boolean {
	if (buffer.readUint8(0) !== 5) {
		return false
	}

	if (!FMXPTEffectAddresses.map((obj) => obj.address).includes(buffer.readUint8(1))) {
		return false
	}

	if (buffer.readUint8(2) !== 0xc0) {
		return false
	}

	const data1 = buffer.readUInt8(3)
	const data2 = buffer.readUInt8(4)

	const foundFM = FMXPTEffectAddresses.find((obj) => obj.address === buffer.readUInt8(1))

	if (!foundFM) {
		return false
	}

	const foundSource = SOURCES[self.config.model].find((obj) => obj.byte1 === data1 && obj.byte2 === data2)

	if (!foundSource) {
		console.log('FMXPT: (NO SOURCE MATCH)', { data1, data2, foundFM, foundSource })
		return false
	}

	// TODO: Handle feedbacks for FM XPT
	console.log('INCOMING: FMXPT:', foundFM, foundSource)

	//look in the self.DATA.xpt to see if the aux  is already there, if it is, update it, if not, add it.
	//if the source is already there, update it, if not, add it.

	if (!self.DATA.xpt[foundFM.id]) {
		self.DATA.xpt[foundFM.id] = {}
	}

	self.DATA.xpt[foundFM.id] = foundSource.id

	if (self.xptInterval) {
		clearInterval(self.xptInterval)
	}

	//update variables and feedbacks
	self.xptInterval = setTimeout(() => {
		self.updateVariableValues()
		self.checkFeedbacks()
		clearInterval(self.xptInterval)
	}, 500)

	return true
}
