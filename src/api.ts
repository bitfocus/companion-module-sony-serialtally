import { InstanceStatus, TCPHelper } from '@companion-module/base'
import type { xvsInstance } from './main.js'
import * as constants from './constants.js'

import { CheckVariables } from './variables.js'

export function initConnection(self: xvsInstance): void {
	//create socket connection
	self.log('debug', 'initConnection')

	if (self.config.host !== '') {
		self.log('info', `Connecting to ${self.config.host}`)
		self.tcp = new TCPHelper(self.config.host, self.config.port)

		self.tcp.on('connect', () => {
			self.log('debug', 'Connected')
			self.updateStatus(InstanceStatus.Ok) // Set status to OK
			//start an interval to read states every 500ms
			self.INTERVAL = setInterval(() => {
				readStates(self)
			}, 500)
		})

		self.tcp.on('data', (data) => {
			self.log('debug', `Received data: ${data}`)
			processData(data) //process that data for feedbacks and variables
		})

		self.tcp.on('error', (err) => {
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

	//read m/e states
	for (let eff of effs) {
		for (let bus of busses) {
			let buffer = Buffer.alloc(4)

			buffer.writeUInt8(0x02, 0) //2 bytes is the length of the command
			buffer.writeUInt8(eff.address, 1) //effect address
			buffer.writeUInt8(bus.readByte, 2) //bus address
			self.tcp.send(buffer)
		}
	}

	//read aux states
	for (let aux of auxes) {
		let buffer = Buffer.alloc(4)

		buffer.writeUInt8(0x02, 0) //2 bytes is the length of the command
		buffer.writeUInt8(aux.address, 1) //aux address
		buffer.writeUInt8(0x40, 2) //read command
		self.tcp.send(buffer)
	}
}

function processData(data: Buffer): void {
	//parse the data and update feedbacks and variables

	if (Number(data) == 0x84) {
		//this is an ACK
	}
	else {
		//this is the real response
	}
}

export function xptME(self: xvsInstance, effId: string, busId: string, sourceId: string): void {
	self.log('debug', `xptME: ${effId}, ${busId}, ${sourceId}`)
	let buffer = Buffer.alloc(4)

	//look up the effect, bus, and source addresses
	let eff: any = constants.EFF.find((x) => x.id === effId)
	let bus: any
	let source: any

	if (self.config.model == 'xvs-9000') {
		bus = constants.BUSSES_XVS9000.find((x) => x.id === busId)
		source = constants.SOURCES_XVS9000.find((x) => x.id === parseInt(sourceId))
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
	self.log('debug', `xptAux: ${auxId}, ${sourceId}`)
	let buffer = Buffer.alloc(4)

	//look up the aux and source addresses
	let aux: any = constants.EFF_AUX.find((x) => x.id === auxId)
	let source: any

	if (self.config.model == 'xvs-9000') {
		source = constants.SOURCES_XVS9000.find((x) => x.id === parseInt(sourceId))
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

function sendCommand(self: xvsInstance, buffer: Buffer): void {
	if (self.tcp !== undefined && self.tcp.isConnected == true) {
		self.log('debug', `Sending: ${buffer.toString('hex')}`)
		self.tcp.send(buffer)
	}
}