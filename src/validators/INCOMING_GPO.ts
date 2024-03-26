import { xvsInstance } from '../main.js'

export function INCOMING_GPO(self: xvsInstance, buffer: Buffer): boolean {
	//I have no idea what the protocol is asking for here

	const data1 = buffer.readUInt8(3) & 0x1
	const data2 = buffer.readUInt8(4)

	// TODO: handle feedbacks for GPIO
	console.log('INCOMING: GPI OUT:', data1, data2)

	//it should save it to the internal store like this: self.DATA.gpo[gpo.id] = state where state is 0 or 1, 1 being high, 0 being low (opposite of GPI)

	if (self.gpioUpdateTimer) {
		clearInterval(self.gpioUpdateTimer)
	}

	//update variables and feedbacks
	self.gpioUpdateTimer = setTimeout(() => {
		self.updateVariableValues()
		self.checkFeedbacks()
		clearInterval(self.gpioUpdateTimer)
	}, 500)

	return true
}
