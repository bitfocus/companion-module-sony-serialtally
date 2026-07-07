import { xvsInstance } from '../main.js'

export function INCOMING_GPI(self: xvsInstance, buffer: Buffer): boolean {
	//I have no idea what the protocol is asking for here

	const data1 = buffer.readUInt8(3) & 0x1
	const data2 = buffer.readUInt8(4)

	self.logVerbose(`INCOMING: GPI IN: ${data1}, ${data2}`)

	if (self.gpioUpdateTimer) {
		clearInterval(self.gpioUpdateTimer)
	}

	//update variables (no applicable feedback exists for GPI yet)
	self.gpioUpdateTimer = setTimeout(() => {
		self.updateVariableValues()
		clearInterval(self.gpioUpdateTimer)
	}, self.INTERVAL_RATE)

	return true
}
