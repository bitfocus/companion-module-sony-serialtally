import { xvsInstance } from '../main.js'
import { BUSSES, MEXPTEffectAddresses, SOURCES } from '../constants.js'

export function INCOMING_ME_XPT(self: xvsInstance, buffer: Buffer): boolean {
	if (buffer.readUint8(0) !== 4) {
		return false
	}

	if (!MEXPTEffectAddresses.map((obj) => obj.address).includes(buffer.readUint8(1))) {
		return false
	}

	const commandCode = buffer.readUint8(2)

	const foundBus = BUSSES[self.config.model]?.find((obj) => commandCode === obj.writeByte)

	if (!foundBus) {
		self.log('error', 'INCOMING ME XPT - NO BUS MATCH')
		return false
	}

	const data1 = buffer.readUInt8(3) & 0x1
	const data2 = buffer.readUInt8(4)

	const foundME = MEXPTEffectAddresses.find((obj) => obj.address === buffer.readUInt8(1))

	if (!foundME) {
		return false
	}

	const foundSource = SOURCES[self.config.model].find((obj) => obj.byte1 === data1 && obj.byte2 === data2)

	if (!foundSource) {
		console.log('INCOMING: MEXPT: (NO SOURCE MATCH)', { foundME, foundBus, foundSource })
		self.log('error', 'INCOMING ME XPT - NO SOURCE MATCH')
		return false
	}

	// TODO: handle feedbacks for ME XPT
	//console.log('INCOMING: MEXPT:', foundME, foundBus, foundSource)

	//store the current state of the M/E XPT
	//look in the self.DATA.xpt to see if the ME's bus is already there, if it is, update it, if not, add it.
	//if the source is already there, update it, if not, add it.

	if (!self.DATA.xpt[foundME.id]) {
		self.DATA.xpt[foundME.id] = {}
	}

	if (!self.DATA.xpt[foundME.id][foundBus.id]) {
		self.DATA.xpt[foundME.id][foundBus.id] = {}
	}

	self.DATA.xpt[foundME.id][foundBus.id] = foundSource.id

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
