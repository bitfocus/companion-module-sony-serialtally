import { InstanceStatus, TCPHelper } from '@companion-module/base'
import type { xvsInstance } from './main.js'
import * as constants from './constants.js'

import { CheckVariables } from './variables.js'

export function initConnection(self: xvsInstance): void {
	//create socket connection
	self.log('debug', 'initConnection')

	if (self.config.host && self.config.host !== '') {
		self.log('info', `Connecting to ${self.config.host}`)
		self.tcp = new TCPHelper(self.config.host, self.config.port)

		self.tcp.on('connect', () => {
			self.log('debug', 'Connected')
			self.updateStatus(InstanceStatus.Ok) // Set status to OK
			//start an interval to read states
			self.INTERVAL = setInterval(() => {
				readStates(self)
			}, self.config.pollInterval)
		})

		self.tcp.on('data', (data: any) => {
			self.log('debug', `Received data: ${data}`)
			processData(self, data) //process that data for feedbacks and variables
		})

		self.tcp.on('error', (err:  any) => {
			self.log('error', `Error: ${err}`)
		})
	}
}

export function readStates(self: xvsInstance): void {
	//loop through each effect and bus to retrieve the state
	self.log('debug', 'readStates')

	//look up the effect, bus, and source addresses
	let effs: any = constants.EFF
	let busses: any
	let auxes: any = constants.EFF_AUX

	if (self.config.model == 'xvs-9000') {
		busses = constants.BUSSES_XVS9000
	}
	else if (self.config.model == 'xvs-g1') {
		busses = constants.BUSSES_XVSG1
	}
	else if (self.config.model == 'mls-x1') {
		busses = constants.BUSSES_MLSX1
	}

	//read m/e states
	for (let eff of effs) {
		for (let bus of busses) {
			let buffer = Buffer.alloc(3)

			buffer.writeUInt8(0x02, 0) //2 bytes is the length of the command
			buffer.writeUInt8(eff.address, 1) //effect address
			buffer.writeUInt8(bus.readByte, 2) //bus address
			sendCommand(self, buffer)
		}
	}

	//read aux states
	for (let aux of auxes) {
		let buffer = Buffer.alloc(3)

		buffer.writeUInt8(0x02, 0) //2 bytes is the length of the command
		buffer.writeUInt8(aux.address, 1) //aux address
		buffer.writeUInt8(0x40, 2) //read command
		sendCommand(self, buffer)
	}
}

function processData(self: xvsInstance, data: Buffer): void {
	//parse the data and update feedbacks and variables

	if (Number(data) == 0x84) {
		//this is an ACK
	}
	else {
		//this is the real response
		let effAddress: number = data.readUInt8(1)
		let busAddress: number = data.readUInt8(2)
		let sourceAddressByte1: number = data.readUInt8(3)
		let sourceAddressByte2: number = data.readUInt8(4)

		//look up the effect, bus, and source addresses
		let eff: any = constants.EFF.find((x) => x.address === effAddress)
		let bus: any
		let source: any

		if (self.config.model == 'xvs-9000') {
			bus = constants.BUSSES_XVS9000.find((x) => x.readByte === busAddress)
			source = constants.SOURCES_XVS9000.find((x) => x.byte1 === sourceAddressByte1 && x.byte2 === sourceAddressByte2)
		}
		else if (self.config.model == 'xvs-g1') {
			bus = constants.BUSSES_XVSG1.find((x) => x.readByte === busAddress)
			source = constants.SOURCES_XVSG1.find((x) => x.byte1 === sourceAddressByte1 && x.byte2 === sourceAddressByte2)
		}
		else if (self.config.model == 'mls-x1') {
			bus = constants.BUSSES_MLSX1.find((x) => x.readByte === busAddress)
			source = constants.SOURCES_MLSX1.find((x) => x.byte1 === sourceAddressByte1 && x.byte2 === sourceAddressByte2)
		}

		if (eff && bus && source) {
			self.DATA[eff.id][bus.id] = source.id
		}
		else {
			//maybe this is an aux
			let auxAddress: number = data.readUInt8(1)
			let sourceAddressByte1: number = data.readUInt8(2)
			let sourceAddressByte2: number = data.readUInt8(3)

			let aux: any = constants.EFF_AUX.find((x) => x.address === auxAddress)

			if (self.config.model == 'xvs-9000') {
				source = constants.SOURCES_XVS9000.find((x) => x.byte1 === sourceAddressByte1 && x.byte2 === sourceAddressByte2)
			}
			else if (self.config.model == 'xvs-g1') {
				source = constants.SOURCES_XVSG1.find((x) => x.byte1 === sourceAddressByte1 && x.byte2 === sourceAddressByte2)
			}
			else if (self.config.model == 'mls-x1') {
				source = constants.SOURCES_MLSX1.find((x) => x.byte1 === sourceAddressByte1 && x.byte2 === sourceAddressByte2)
			}

			if (aux && source) {
				self.DATA[aux.id] = source.id
			}
		}

		self.checkFeedbacks();
		CheckVariables(self);
	}
}

export function xptME(self: xvsInstance, effId: string, busId: string, sourceId: string): void {
	self.log('debug', `xptME: ${effId}, ${busId}, ${sourceId}`)
	let buffer = Buffer.alloc(5)

	//look up the effect, bus, and source addresses
	let eff: any = constants.EFF.find((x) => x.id === effId)
	let bus: any
	let source: any

	if (self.config.model == 'xvs-9000') {
		bus = constants.BUSSES_XVS9000.find((x) => x.id === busId)
		source = constants.SOURCES_XVS9000.find((x) => x.id === parseInt(sourceId))
	}
	else if (self.config.model == 'xvs-g1') {
		bus = constants.BUSSES_XVSG1.find((x) => x.id === busId)
		source = constants.SOURCES_XVSG1.find((x) => x.id === parseInt(sourceId))
	}
	else if (self.config.model == 'mls-x1') {
		bus = constants.BUSSES_MLSX1.find((x) => x.id === busId)
		source = constants.SOURCES_MLSX1.find((x) => x.id === parseInt(sourceId))
	}

	if (bus && source) {
		let effAddress: number = eff.address
		let busAddress: number = bus.writeByte
		let sourceAddressByte1: number = source.byte1
		let sourceAddressByte2: number = source.byte2

		buffer.writeUInt8(0x04, 0) //4 bytes is the length of the command
		buffer.writeUInt8(effAddress, 1) //effect address
		buffer.writeUInt8(busAddress, 2) //bus address
		buffer.writeUInt8(sourceAddressByte1, 3) //source address byte 1
		buffer.writeUInt8(sourceAddressByte2, 4) //source address byte 2
		sendCommand(self, buffer)
	}
}

export function xptAUX(self: xvsInstance, auxId: string, sourceId: string): void {
	self.log('debug', `xptAUX: ${auxId}, ${sourceId}`)
	let buffer = Buffer.alloc(5)

	//look up the aux and source addresses
	let aux: any = constants.EFF_AUX.find((x) => x.id === auxId)
	let source: any

	if (self.config.model == 'xvs-9000') {
		source = constants.SOURCES_XVS9000.find((x) => x.id === parseInt(sourceId))
	}
	else if (self.config.model == 'xvs-g1') {
		source = constants.SOURCES_XVSG1.find((x) => x.id === parseInt(sourceId))
	}
	else if (self.config.model == 'mls-x1') {
		source = constants.SOURCES_MLSX1.find((x) => x.id === parseInt(sourceId))
	}

	if (source) {
		let auxAddress: number = aux.address
		let sourceAddressByte1: number = source.byte1
		let sourceAddressByte2: number = source.byte2

		buffer.writeUInt8(0x04, 0) //4 bytes is the length of the command
		buffer.writeUInt8(auxAddress, 1) //aux address
		buffer.writeUInt8(0xC0, 2) //write command
		buffer.writeUInt8(sourceAddressByte1, 3) //source address byte 1
		buffer.writeUInt8(sourceAddressByte2, 4) //source address byte 2
		sendCommand(self, buffer)
	}
}

export function transitionME(self: xvsInstance, effId: string, cmdId: string, transRate: number) {
	self.log('debug', `transitionME: ${effId}, ${cmdId}`)
	let buffer = Buffer.alloc(7)

	//look up the effect address
	let eff: any = constants.EFF.find((x) => x.id === effId)

	//look up the command
	let cmd: any = constants.AUTOTRANSITION_EFF.find((x) => x.id === cmdId)

	if (eff && cmd) {
		let effAddress: number = eff.address
		let cmdAddress: number = cmd.writeByte

		//take the transRate and split the value into two bytes
		let transRateByte1: number = (transRate >> 8) & 0xFF
		let transRateByte2: number = transRate & 0xFF

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

export function transitionMECancel(self: xvsInstance, effId: string, cmdId: string) {
	self.log('debug', `transitionMECancel: ${effId}, ${cmdId}`)
	let buffer = Buffer.alloc(5)

	//look up the effect address
	let eff: any = constants.EFF.find((x) => x.id === effId)

	//look up the command
	let cmd: any = constants.AUTOTRANSITION_EFF.find((x) => x.id === cmdId)

	if (eff && cmd) {
		let effAddress: number = eff.address
		let cmdAddress: number = cmd.writeByte

		buffer.writeUInt8(0x04, 0) //4 bytes is the length of the command
		buffer.writeUInt8(effAddress, 1) //effect address
		buffer.writeUInt8(cmdAddress, 2) //command
		buffer.writeUInt8(0x19, 3) //command
		buffer.writeUInt8(0x00, 4) //command
		sendCommand(self, buffer)
	}
}

export function keyOnOff(self: xvsInstance, effId: string, keyId: string, cmd: string) {
	self.log('debug', `transitionME: ${effId}, ${cmd}`)
	let buffer = Buffer.alloc(4)

	//look up the effect address
	let eff: any = constants.EFF.find((x) => x.id === effId)

	//look up the key
	let key: any = constants.KEYS.find((x) => x.id === keyId)

	if (eff && key) {
		let effAddress: number = eff.address
		let keyAddress: number = key.address

		buffer.writeUInt8(0x03, 0) //4 bytes is the length of the command
		buffer.writeUInt8(effAddress, 1) //effect address
		if (cmd == 'on') {
			buffer.writeUInt8(0xDA, 2) //command on
		}
		else {
			buffer.writeUInt8(0x9A, 2) //command off
		}
		buffer.writeUInt8(keyAddress, 3) //key number
		sendCommand(self, buffer)
	}
}

export function recallSnapshot(self: xvsInstance, regionSelectPart1: string[], registerNumber: number, regionSelectPart2: Number[], regionselectPart3: string[]) {
	self.log('debug', `recallSnapshot: ${regionSelectPart1}, ${registerNumber}, ${regionSelectPart2}, ${regionselectPart3}`)
	let buffer = Buffer.alloc(7)

	let byte3: number = 0x00
	let byte5: number = 0x00
	let byte6: number = 0x00

	//create byte 3 - region select 1
	let regionSelectPart1_bit7 = 0
	let regionSelectPart1_bit6 = 0
	let regionSelectPart1_bit5 = regionSelectPart1.includes('me5') ? 1 : 0
	let regionSelectPart1_bit4 = regionSelectPart1.includes('me4') ? 1 : 0
	let regionSelectPart1_bit3 = regionSelectPart1.includes('me3') ? 1 : 0
	let regionSelectPart1_bit2 = regionSelectPart1.includes('me2') ? 1 : 0
	let regionSelectPart1_bit1 = regionSelectPart1.includes('me1') ? 1 : 0
	let regionSelectPart1_bit0 = regionSelectPart1.includes('pp') ? 1 : 0

	//now combine them all into a string
	let byte3_string = `${regionSelectPart1_bit7}${regionSelectPart1_bit6}${regionSelectPart1_bit5}${regionSelectPart1_bit4}${regionSelectPart1_bit3}${regionSelectPart1_bit2}${regionSelectPart1_bit1}${regionSelectPart1_bit0}`
	byte3 = parseInt(byte3_string, 2) //convert to number with radix of 2 (binary)

	//create byte 5 - region select 2
	let regionSelectPart2_bit7 = regionSelectPart2.includes(8) ? 1 : 0
	let regionSelectPart2_bit6 = regionSelectPart2.includes(7) ? 1 : 0
	let regionSelectPart2_bit5 = regionSelectPart2.includes(6) ? 1 : 0
	let regionSelectPart2_bit4 = regionSelectPart2.includes(5) ? 1 : 0
	let regionSelectPart2_bit3 = regionSelectPart2.includes(4) ? 1 : 0
	let regionSelectPart2_bit2 = regionSelectPart2.includes(3) ? 1 : 0
	let regionSelectPart2_bit1 = regionSelectPart2.includes(2) ? 1 : 0
	let regionSelectPart2_bit0 = regionSelectPart2.includes(1) ? 1 : 0

	//now combine them all into a string
	let byte5_string = `${regionSelectPart2_bit7}${regionSelectPart2_bit6}${regionSelectPart2_bit5}${regionSelectPart2_bit4}${regionSelectPart2_bit3}${regionSelectPart2_bit2}${regionSelectPart2_bit1}${regionSelectPart2_bit0}`
	byte5 = parseInt(byte5_string, 2) //convert to number with radix of 2 (binary)

	//create byte 6 - region select 3
	let regionSelectPart3_bit7 = 0
	let regionSelectPart3_bit6 = 0
	let regionSelectPart3_bit5 = regionselectPart3.includes('me5') ? 1 : 0
	let regionSelectPart3_bit4 = regionselectPart3.includes('me4') ? 1 : 0
	let regionSelectPart3_bit3 = regionselectPart3.includes('me3') ? 1 : 0
	let regionSelectPart3_bit2 = regionselectPart3.includes('me2') ? 1 : 0
	let regionSelectPart3_bit1 = regionselectPart3.includes('me1') ? 1 : 0
	let regionSelectPart3_bit0 = regionselectPart3.includes('pp') ? 1 : 0

	//now combine them all into a string
	let byte6_string = `${regionSelectPart3_bit7}${regionSelectPart3_bit6}${regionSelectPart3_bit5}${regionSelectPart3_bit4}${regionSelectPart3_bit3}${regionSelectPart3_bit2}${regionSelectPart3_bit1}${regionSelectPart3_bit0}`
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

export function macroRecall(self: xvsInstance, macroNumber: string) {
	self.log('debug', `macroRecall: ${macroNumber}`)
	let buffer = Buffer.alloc(7)

	let macroNumberByte1: number = 0
	let macroNumberByte2: number = 0

	//take the macroNumber, convert it to an integer, and then split the value into two bytes
	let macroNumberInt: number = parseInt(macroNumber)
	macroNumberByte1 = (macroNumberInt >> 8) & 0xFF
	macroNumberByte2 = macroNumberInt & 0xFF

	buffer.writeUInt8(0x03, 0) //6 bytes is the length of the command
	buffer.writeUInt8(0x22, 1) //command
	buffer.writeUInt8(0x91, 2) //command
	buffer.writeUInt8(0x00, 3) //command
	buffer.writeUInt8(0x17, 4) //command
	buffer.writeUInt8(macroNumberByte1, 5) //macro number byte 1
	buffer.writeUInt8(macroNumberByte2, 6) //macro number byte 2
	sendCommand(self, buffer)
}

export function macroTake(self: xvsInstance) {
	self.log('debug', `macroTake`)
	let buffer = Buffer.alloc(5)

	buffer.writeUInt8(0x04, 0) //4 bytes is the length of the command
	buffer.writeUInt8(0x22, 1) //command
	buffer.writeUInt8(0x90, 2) //command
	buffer.writeUInt8(0x00, 3) //command
	buffer.writeUInt8(0x1C, 4) //command
	sendCommand(self, buffer)

}

function sendCommand(self: xvsInstance, buffer: Buffer): void {
	if (self.tcp !== undefined && self.tcp.isConnected == true) {
		self.log('debug', `Sending: ${buffer.toString('hex')}`)
		self.tcp.send(buffer)
	}
}