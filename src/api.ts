import { InstanceStatus, TCPHelper } from '@companion-module/base'
import type { xvsInstance } from './main.js'
import {
	EffectAddress,
	MEXPTEffectAddresses,
	Bus,
	BUSSES,
	AUXXPTEffectAddresses,
	FMXPTEffectAddresses,
	Source,
	SOURCES,
	AUTOTRANSITION_EFF,
	KEYS,
} from './constants.js'

//import { CheckVariables } from './variables.js'
import { INCOMING_HANDLE } from './validators/index.js'

export function initConnection(self: xvsInstance): void {
	//create socket connection
	self.log('debug', 'initConnection')

	if (self.config.host && self.config.host !== '') {
		self.log('info', `Connecting to ${self.config.host}`)
		self.tcp = new TCPHelper(self.config.host, self.config.port)
		self.PROTOCOL_STATE = 'IDLE'

		self.tcp.on('connect', () => {
			// clear buffer
			self.incomingData = Buffer.alloc(0)
			self.incomingCommandQueue = []
			self.outgoingCommandQueue = []

			// Reset data
			self.DATA = {
				sourceNames: [],
				xpt: [],
			}

			// tell the module we are connected, and waiting for ack
			self.PROTOCOL_STATE = 'WAITING'

			self.log('debug', 'Connected, waiting for ACK')
			self.updateStatus(InstanceStatus.Connecting, 'Waiting for ack') // Set status to OK
		})

		self.tcp.on('data', (data: any) => {
			self.incomingData = Buffer.concat([self.incomingData, data])

			// check if we have a complete command
			if (self.incomingData.readUInt8(0) === 0x84) {
				console.log('got ACK')
				// this is an ACK, we can ignore it
				self.incomingData = self.incomingData.subarray(1)
				self.updateStatus(InstanceStatus.Ok)
				self.log('debug', 'ACK received, connected.')

				if (self.PROTOCOL_STATE === 'WAITING') {
					readStates(self)
				}
				self.PROTOCOL_STATE = 'OK'
			}

			/*if (self.incomingData.length && self.incomingData.readUInt8(0) === 0x0b) {
				console.log('----------------------------------------------------------------- 0x0b')
				self.incomingData = self.incomingData.subarray(1)
			}*/

			if (self.PROTOCOL_STATE === 'OK') {
				while (self.incomingData.length > 0) {
					const commandLength = self.incomingData.readUInt8(0)
					if (self.incomingData.length >= commandLength) {
						const command = self.incomingData.subarray(0, commandLength + 1)
						self.incomingData = self.incomingData.subarray(commandLength + 1)
						self.incomingCommandQueue.push(command)
					} else {
						break
					}
				}
			}

			while (self.incomingCommandQueue.length > 0) {
				const command = self.incomingCommandQueue.shift()
				if (command) {
					//console.log('Processing command:', command)
					processData(self, command)
				}
			}
		})

		self.tcp.on('error', (err: any) => {
			self.log('error', `Error: ${err}`)
			self.PROTOCOL_STATE = 'IDLE'
			self.updateStatus(InstanceStatus.UnknownError, 'Connection error')
		})
	}
}

export function readStates(self: xvsInstance): void {
	//loop through each effect and bus to retrieve the state
	//look up the effect, bus, and source addresses

	//read m/e states
	const bufferME = Buffer.alloc(3)
	for (const eff of MEXPTEffectAddresses) {
		for (const bus of BUSSES[self.config.model]) {
			bufferME.writeUInt8(0x02, 0) //2 bytes is the length of the command
			bufferME.writeUInt8(eff.address, 1) //effect address
			bufferME.writeUInt8(bus.readByte, 2) //bus address
			sendCommand(self, bufferME, false)
		}
	}

	//read aux states
	const bufferAUX = Buffer.alloc(3)
	for (const aux of AUXXPTEffectAddresses) {
		bufferAUX.writeUInt8(0x02, 0) //2 bytes is the length of the command
		bufferAUX.writeUInt8(aux.address, 1) //aux address
		bufferAUX.writeUInt8(0x40, 2) //read command
		sendCommand(self, bufferAUX, false)
	}

	//read fm states
	const bufferFM = Buffer.alloc(3)
	for (const fm of FMXPTEffectAddresses) {
		bufferFM.writeUInt8(0x02, 0) //2 bytes is the length of the command
		bufferFM.writeUInt8(fm.address, 1) //effect address
		bufferFM.writeUInt8(0x40, 2) //read command
		sendCommand(self, bufferFM, false)
	}

	//read source name setup
	const bufferSource = Buffer.alloc(6)

	for (const source of SOURCES[self.config.model]) {
		bufferSource.writeUInt8(0x05, 0) //2 bytes is the length of the command
		bufferSource.writeUInt8(0x20, 1)
		bufferSource.writeUInt8(0x70, 2)
		bufferSource.writeUInt8(0x50, 3)
		bufferSource.writeUInt8(source.byte1, 4)
		bufferSource.writeUInt8(source.byte2, 5)
		sendCommand(self, bufferSource, false)
	}

	//enable virtual GPI In/Out interface
	const bufferGPI = Buffer.alloc(4)
	bufferGPI.writeUInt8(0x03, 0) //3 bytes is the length of the command
	bufferGPI.writeUInt8(0x02, 1)
	bufferGPI.writeUInt8(0x26, 2)
	bufferGPI.writeUInt8(0x01, 3)
	sendCommand(self, bufferGPI, false)
}

function processData(self: xvsInstance, data: Buffer): void {
	INCOMING_HANDLE(self, data)
}

export function xptME(self: xvsInstance, effId: string, busId: string, sourceId: string): void {
	console.log(`xptME: ${effId}, ${busId}, ${sourceId}`)
	const buffer = Buffer.alloc(5)

	//look up the effect, bus, and source addresses
	const eff: EffectAddress | undefined = MEXPTEffectAddresses.find((x) => x.id === effId)
	const bus: Bus | undefined = BUSSES[self.config.model].find((x) => x.id === busId)
	const source: Source | undefined = SOURCES[self.config.model].find((x) => x.id === parseInt(sourceId))

	if (eff && bus && source) {
		const effAddress: number = eff.address
		const busAddress: number = bus.writeByte
		const sourceAddressByte1: number = source.byte1
		const sourceAddressByte2: number = source.byte2

		buffer.writeUInt8(0x04, 0) //4 bytes is the length of the command
		buffer.writeUInt8(effAddress, 1) //effect address
		buffer.writeUInt8(busAddress, 2) //bus address
		buffer.writeUInt8(sourceAddressByte1, 3) //source address byte 1
		buffer.writeUInt8(sourceAddressByte2, 4) //source address byte 2
		sendCommand(self, buffer)
	}
}

export function copyME(self: xvsInstance, effId: string, copyEffId: string, busId: string): void {
	console.log(`copyME: FROM ${effId}, TO ${copyEffId}, BUS ${busId}`)

	//figure out what the source is on the eff, and then send that source to the copyEff
	const sourceId: number = self.DATA.xpt[effId]

	if (sourceId) {
		xptME(self, copyEffId, busId, sourceId.toString())
	}
}

export function xptAUX(self: xvsInstance, auxId: string, sourceId: string): void {
	self.log('debug', `xptAUX: ${auxId}, ${sourceId}`)
	const buffer = Buffer.alloc(5)

	//look up the aux and source addresses
	const aux: EffectAddress | undefined = AUXXPTEffectAddresses.find((x) => x.id === auxId)
	const source: Source | undefined = SOURCES[self.config.model].find((x) => x.id === parseInt(sourceId))

	if (aux && source) {
		const auxAddress: number = aux.address
		const sourceAddressByte1: number = source.byte1
		const sourceAddressByte2: number = source.byte2

		buffer.writeUInt8(0x04, 0) //4 bytes is the length of the command
		buffer.writeUInt8(auxAddress, 1) //aux address
		buffer.writeUInt8(0xc0, 2) //write command
		buffer.writeUInt8(sourceAddressByte1, 3) //source address byte 1
		buffer.writeUInt8(sourceAddressByte2, 4) //source address byte 2
		sendCommand(self, buffer)
	}
}

export function copyAUX(self: xvsInstance, auxId: string, copyAuxId: string): void {
	self.log('debug', `copyAUX: FROM ${auxId}, TO ${copyAuxId}`)

	//figure out what the source is on the aux, and then send that source to the copyAux
	const sourceId: number = self.DATA.xpt[auxId]

	if (sourceId) {
		xptAUX(self, copyAuxId, sourceId.toString())
	}
}

export function transitionME(self: xvsInstance, effId: string, cmdId: string, transRate: number): void {
	self.log('debug', `transitionME: ${effId}, ${cmdId}`)
	const buffer = Buffer.alloc(7)

	//look up the effect address
	const eff: any = MEXPTEffectAddresses.find((x) => x.id === effId)

	//look up the command
	const cmd: any = AUTOTRANSITION_EFF.find((x) => x.id === cmdId)

	if (eff && cmd) {
		const effAddress: number = eff.address
		const cmdAddress: number = cmd.writeByte

		//take the transRate and split the value into two bytes
		const transRateByte1: number = (transRate >> 8) & 0xff
		const transRateByte2: number = transRate & 0xff

		buffer.writeUInt8(0x06, 0) //6 bytes is the length of the command
		buffer.writeUInt8(effAddress, 1) //effect address
		buffer.writeUInt8(cmdAddress, 2) //command
		buffer.writeUInt8(0x16, 3) //command
		buffer.writeUInt8(0x00, 4) //command
		buffer.writeUInt8(transRateByte1, 5) //command
		buffer.writeUInt8(transRateByte2, 6) //command
		sendCommand(self, buffer)
	}
}

export function transitionMECancel(self: xvsInstance, effId: string, cmdId: string): void {
	self.log('debug', `transitionMECancel: ${effId}, ${cmdId}`)
	const buffer = Buffer.alloc(5)

	//look up the effect address
	const eff: any = MEXPTEffectAddresses.find((x) => x.id === effId)

	//look up the command
	const cmd: any = AUTOTRANSITION_EFF.find((x) => x.id === cmdId)

	if (eff && cmd) {
		const effAddress: number = eff.address
		const cmdAddress: number = cmd.writeByte

		buffer.writeUInt8(0x04, 0) //4 bytes is the length of the command
		buffer.writeUInt8(effAddress, 1) //effect address
		buffer.writeUInt8(cmdAddress, 2) //command
		buffer.writeUInt8(0x19, 3) //command
		buffer.writeUInt8(0x00, 4) //command
		sendCommand(self, buffer)
	}
}

export function keyOnOff(self: xvsInstance, effId: string, keyId: string, cmd: string): void {
	self.log('debug', `keyOnOff: ${effId}, ${keyId} ${cmd}`)
	const buffer = Buffer.alloc(4)

	//look up the effect address
	const eff: any = MEXPTEffectAddresses.find((x) => x.id === effId)

	//look up the key
	const key: any = KEYS.find((x) => x.id === keyId)

	if (eff && key) {
		const effAddress: number = eff.address
		const keyAddress: number = key.address

		buffer.writeUInt8(0x03, 0) //4 bytes is the length of the command
		buffer.writeUInt8(effAddress, 1) //effect address
		if (cmd == 'on') {
			buffer.writeUInt8(0xda, 2) //command on
		} else {
			buffer.writeUInt8(0x9a, 2) //command off
		}
		buffer.writeUInt8(keyAddress, 3) //key number
		sendCommand(self, buffer)
	}
}

export function recallSnapshot(
	self: xvsInstance,
	regionSelectPart1: string[],
	registerNumber: number,
	regionSelectPart2: number[],
	regionselectPart3: string[]
): void {
	self.log(
		'debug',
		`recallSnapshot: ${regionSelectPart1}, ${registerNumber}, ${regionSelectPart2}, ${regionselectPart3}`
	)
	const buffer = Buffer.alloc(7)

	let byte3 = 0x00
	let byte5 = 0x00
	let byte6 = 0x00

	//create byte 3 - region select 1
	const regionSelectPart1_bit7 = 0
	const regionSelectPart1_bit6 = 0
	const regionSelectPart1_bit5 = regionSelectPart1.includes('me5') ? 1 : 0
	const regionSelectPart1_bit4 = regionSelectPart1.includes('me4') ? 1 : 0
	const regionSelectPart1_bit3 = regionSelectPart1.includes('me3') ? 1 : 0
	const regionSelectPart1_bit2 = regionSelectPart1.includes('me2') ? 1 : 0
	const regionSelectPart1_bit1 = regionSelectPart1.includes('me1') ? 1 : 0
	const regionSelectPart1_bit0 = regionSelectPart1.includes('pp') ? 1 : 0

	//now combine them all into a string
	const byte3_string = `${regionSelectPart1_bit7}${regionSelectPart1_bit6}${regionSelectPart1_bit5}${regionSelectPart1_bit4}${regionSelectPart1_bit3}${regionSelectPart1_bit2}${regionSelectPart1_bit1}${regionSelectPart1_bit0}`
	byte3 = parseInt(byte3_string, 2) //convert to number with radix of 2 (binary)

	//create byte 5 - region select 2
	const regionSelectPart2_bit7 = regionSelectPart2.includes(8) ? 1 : 0
	const regionSelectPart2_bit6 = regionSelectPart2.includes(7) ? 1 : 0
	const regionSelectPart2_bit5 = regionSelectPart2.includes(6) ? 1 : 0
	const regionSelectPart2_bit4 = regionSelectPart2.includes(5) ? 1 : 0
	const regionSelectPart2_bit3 = regionSelectPart2.includes(4) ? 1 : 0
	const regionSelectPart2_bit2 = regionSelectPart2.includes(3) ? 1 : 0
	const regionSelectPart2_bit1 = regionSelectPart2.includes(2) ? 1 : 0
	const regionSelectPart2_bit0 = regionSelectPart2.includes(1) ? 1 : 0

	//now combine them all into a string
	const byte5_string = `${regionSelectPart2_bit7}${regionSelectPart2_bit6}${regionSelectPart2_bit5}${regionSelectPart2_bit4}${regionSelectPart2_bit3}${regionSelectPart2_bit2}${regionSelectPart2_bit1}${regionSelectPart2_bit0}`
	byte5 = parseInt(byte5_string, 2) //convert to number with radix of 2 (binary)

	//create byte 6 - region select 3
	const regionSelectPart3_bit7 = 0
	const regionSelectPart3_bit6 = 0
	const regionSelectPart3_bit5 = regionselectPart3.includes('me5') ? 1 : 0
	const regionSelectPart3_bit4 = regionselectPart3.includes('me4') ? 1 : 0
	const regionSelectPart3_bit3 = regionselectPart3.includes('me3') ? 1 : 0
	const regionSelectPart3_bit2 = regionselectPart3.includes('me2') ? 1 : 0
	const regionSelectPart3_bit1 = regionselectPart3.includes('me1') ? 1 : 0
	const regionSelectPart3_bit0 = regionselectPart3.includes('pp') ? 1 : 0

	//now combine them all into a string
	const byte6_string = `${regionSelectPart3_bit7}${regionSelectPart3_bit6}${regionSelectPart3_bit5}${regionSelectPart3_bit4}${regionSelectPart3_bit3}${regionSelectPart3_bit2}${regionSelectPart3_bit1}${regionSelectPart3_bit0}`
	byte6 = parseInt(byte6_string, 2) //convert to number with radix of 2 (binary)

	buffer.writeUInt8(0x06, 0) //6 bytes is the length of the command
	buffer.writeUInt8(0x21, 1) //command
	buffer.writeUInt8(0x90, 2) //command
	buffer.writeUInt8(byte3, 3) //command
	buffer.writeUInt8(registerNumber, 4) //command
	buffer.writeUInt8(byte5, 5) //command
	buffer.writeUInt8(byte6, 6) //command
	sendCommand(self, buffer)
}

export function macroRecall(self: xvsInstance, macroNumber: string): void {
	self.log('debug', `macroRecall: ${macroNumber}`)
	const buffer = Buffer.alloc(7)

	let macroNumberByte1 = 0
	let macroNumberByte2 = 0

	//take the macroNumber, convert it to an integer, and then split the value into two bytes
	const macroNumberInt: number = parseInt(macroNumber)
	macroNumberByte1 = (macroNumberInt >> 8) & 0xff
	macroNumberByte2 = macroNumberInt & 0xff

	buffer.writeUInt8(0x06, 0) //6 bytes is the length of the command
	buffer.writeUInt8(0x22, 1) //command
	buffer.writeUInt8(0x91, 2) //command
	buffer.writeUInt8(0x00, 3) //command
	buffer.writeUInt8(0x17, 4) //command
	buffer.writeUInt8(macroNumberByte1, 5) //macro number byte 1
	buffer.writeUInt8(macroNumberByte2, 6) //macro number byte 2
	sendCommand(self, buffer)
}

export function macroTake(self: xvsInstance): void {
	self.log('debug', `macroTake`)
	const buffer = Buffer.alloc(5)

	buffer.writeUInt8(0x04, 0) //4 bytes is the length of the command
	buffer.writeUInt8(0x22, 1) //command
	buffer.writeUInt8(0x90, 2) //command
	buffer.writeUInt8(0x00, 3) //command
	buffer.writeUInt8(0x1c, 4) //command
	sendCommand(self, buffer)
}

export function gpiIn(self: xvsInstance, gpiNumber: number, state: number): void {
	self.log('debug', `activate gpiIn: ${gpiNumber}, ${state}`)
	const buffer = Buffer.alloc(5)

	buffer.writeUInt8(0x04, 0) //4 bytes is the length of the command
	buffer.writeUInt8(0x26, 1) //command
	buffer.writeUInt8(0x80, 2) //command
	buffer.writeUInt8(gpiNumber, 3) //gpi number
	buffer.writeUInt8(state, 4) //state
	sendCommand(self, buffer)
}

export function gpiOut(self: xvsInstance, gpiNumber: number, state: number): void {
	self.log('debug', `activate gpiOut: ${gpiNumber}, ${state}`)
	const buffer = Buffer.alloc(5)

	buffer.writeUInt8(0x04, 0) //4 bytes is the length of the command
	buffer.writeUInt8(0x26, 1) //command
	buffer.writeUInt8(0x81, 2) //command
	buffer.writeUInt8(gpiNumber, 3) //gpi number
	buffer.writeUInt8(state, 4) //state
	sendCommand(self, buffer)
}

export function customCommand(self: xvsInstance, command: string): void {
	self.log('debug', `customCommand: ${command}`)
	const buffer = Buffer.from(command, 'hex')
	sendCommand(self, buffer)
}

function sendCommand(self: xvsInstance, buffer: Buffer, log = true): void {
	if (self.tcp !== undefined && self.tcp.isConnected == true) {
		if (self.config.verbose == true) {
			if (log) {
				//even with verbose mode on, we don't want to log the readStates commands because they come so fast
				//break the hex string into 2 character chunks
				const hexString = buffer.toString('hex')
				const hexArray = hexString.match(/.{1,2}/g)
				//now join them back together with a space, but only if it is not null
				const hexStringSpaced = hexArray ? hexArray.join(' ') : ''
				self.log('debug', `Sending: ${hexStringSpaced}`)
			}
		}

		self.outgoingCommandQueue.push(Buffer.from(buffer))
		if (!self.outputTimer) {
			self.outputTimer = setInterval(() => {
				if (self.outgoingCommandQueue.length > 0) {
					const command = self.outgoingCommandQueue.shift()
					if (command) {
						self.tcp.send(command)
					}
				} else {
					clearInterval(self.outputTimer)
					self.outputTimer = undefined
				}
			}, 10)
		}
	}
}
