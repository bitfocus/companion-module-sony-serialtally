import { xvsInstance } from '../main.js'
import { AUXXPTEffectAddresses, SOURCES } from '../constants.js'

export function INCOMING_AUX_XPT(self: xvsInstance, buffer: Buffer): boolean {
	if (buffer.readUint8(0) !== 4) {
		return false
	}

	if (!AUXXPTEffectAddresses.map((obj) => obj.address).includes(buffer.readUint8(1))) {
		return false
	}

	if (buffer.readUint8(2) !== 0xc0) {
		return false
	}

	const data1 = buffer.readUInt8(3)
	const data2 = buffer.readUInt8(4)

	const foundAux = AUXXPTEffectAddresses.find((obj) => obj.address === buffer.readUInt8(1))

	if (!foundAux) {
		return false
	}

	const foundSource = SOURCES[self.config.model].find((obj) => obj.byte1 === data1 && obj.byte2 === data2)

	if (!foundSource) {
		self.logVerbose(`AUXXPT: (NO SOURCE MATCH) ${JSON.stringify({ data1, data2, foundAux, foundSource })}`)
		return false
	}

	self.logVerbose(`INCOMING: AUXXPT: ${JSON.stringify(foundAux)} ${JSON.stringify(foundSource)}`)

	if (!self.DATA.xpt[foundAux.id]) {
		self.DATA.xpt[foundAux.id] = {}
	}

	self.DATA.xpt[foundAux.id] = foundSource.id

	if (self.xptInterval) {
		clearInterval(self.xptInterval)
	}

	self.xptInterval = setTimeout(() => {
		self.updateVariableValues()
		self.checkFeedbacks('xptMEState', 'xptAUXState', 'xptFMState')
		clearInterval(self.xptInterval)
	}, self.INTERVAL_RATE)

	return true
}
