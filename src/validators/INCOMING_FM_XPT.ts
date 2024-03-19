import { xvsInstance } from '../main.js'
import { FMXPTEffectAddresses } from '../constants.js'

export function INCOMING_FM_XPT(_self: xvsInstance, buffer: Buffer): boolean {
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

	const found = FMXPTEffectAddresses.find((obj) => obj.address === buffer.readUInt8(1))

	if (!found) {
		return false
	}

	// TODO: Handle feedbacks for FM XPT
	console.log('INCOMING: FMXPT:', found, data1, data2)

	return true
}
