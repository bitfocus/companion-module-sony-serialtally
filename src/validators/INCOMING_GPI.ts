import { xvsInstance } from '../main.js'

export function INCOMING_GPI(self: xvsInstance, buffer: Buffer): boolean {
	//I have no idea what the protocol is asking for here

	const data1 = buffer.readUInt8(3) & 0x1
	const data2 = buffer.readUInt8(4)

	// TODO: handle feedbacks for GPIO
	console.log('INCOMING: GPI IN:', data1, data2)

	//it should save it to the internal store like this: self.DATA.gpi[gpi.id] = state where state is 0 or 1, 1 being low, 0 being high.

	if (self.gpioUpdateTimer) {
		clearInterval(self.gpioUpdateTimer)
	}

	//update variables and feedbacks
	self.gpioUpdateTimer = setTimeout(() => {
		self.updateVariableValues()
		self.checkFeedbacks()
		clearInterval(self.gpioUpdateTimer)
	}, self.INTERVAL_RATE)

	return true
}
