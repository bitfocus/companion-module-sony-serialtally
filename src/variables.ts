import type { xvsInstance } from './main.js'
import * as constants from './constants.js'

export function UpdateVariableDefinitions(self: xvsInstance): void {
	let variables = []

	let EFF: any[] = constants.EFF

	let BUSSES: any[] = []
	let SOURCES: any[] = []

	let AUXES: any[] = []

	switch(self.config.model) {
		case 'xvs-9000':
			BUSSES = constants.BUSSES_XVS9000
			SOURCES = constants.SOURCES_XVS9000
			break
		case 'xvs-g1':
			BUSSES = constants.BUSSES_XVSG1
			SOURCES = constants.SOURCES_XVSG1
			break
		case 'mls-x1':
			BUSSES = constants.BUSSES_MLSX1
			SOURCES = constants.SOURCES_MLSX1
			break
	}

	AUXES = constants.EFF_AUX

	for (let eff of EFF) {
		for (let bus of BUSSES) {
			variables.push({
				name: `${eff.label} ${bus.label}`,
				variableId: `${eff.id}_${bus.id}`,
			})
		}
	}

	for (let aux of AUXES) {
		variables.push({
			name: `${aux.label}`,
			variableId: `${aux.id}`,
		})
	}

	self.setVariableDefinitions(variables)
}

export function CheckVariables(self: xvsInstance): void {
	// Check variables

	let variableObj: any = {}

	let EFF: any[] = constants.EFF

	let BUSSES: any[] = []
	let SOURCES: any[] = []

	let AUXES: any[] = []

	switch(self.config.model) {
		case 'xvs-9000':
			BUSSES = constants.BUSSES_XVS9000
			SOURCES = constants.SOURCES_XVS9000
			break
		case 'xvs-g1':
			BUSSES = constants.BUSSES_XVSG1
			SOURCES = constants.SOURCES_XVSG1
			break
		case 'mls-x1':
			BUSSES = constants.BUSSES_MLSX1
			SOURCES = constants.SOURCES_MLSX1
			break
	}

	AUXES = constants.EFF_AUX

	for (let eff of EFF) {
		for (let bus of BUSSES) {
			variableObj[`${eff.id}_${bus.id}`] = self.DATA[eff.id][bus.id]
		}
	}

	for (let aux of AUXES) {
		variableObj[`${aux.id}`] = self.DATA[aux.id]
	}
}