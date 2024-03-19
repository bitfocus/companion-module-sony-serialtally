import type { xvsInstance } from './main.js'
import * as constants from './constants.js'
import { CompanionVariableValues } from '@companion-module/base'

export function UpdateVariableDefinitions(self: xvsInstance): void {
	const variables = []

	const EFF: constants.EffectAddress[] = constants.MEXPTEffectAddresses
	let BUSSES: constants.Bus[] = []
	let AUXES: constants.EffectAddress[] = []

	switch (self.config.model) {
		case 'xvs-9000':
			BUSSES = constants.BUSSES_XVS9000
			break
		case 'xvs-g1':
			BUSSES = constants.BUSSES_XVSG1
			break
		case 'mls-x1':
			BUSSES = constants.BUSSES_MLSX1
			break
	}

	AUXES = constants.AUXXPTEffectAddresses

	for (const eff of EFF) {
		for (const bus of BUSSES) {
			variables.push({
				name: `${eff.label} ${bus.label}`,
				variableId: `${eff.id}_${bus.id}`,
			})
		}
	}

	for (const aux of AUXES) {
		variables.push({
			name: `${aux.label}`,
			variableId: `${aux.id}`,
		})
	}

	self.setVariableDefinitions(variables)
}

export function CheckVariables(self: xvsInstance): void {
	// Check variables

	const variableObj: CompanionVariableValues = {}
	const EFF = constants.MEXPTEffectAddresses

	let BUSSES: any[] = []
	let SOURCES: any[] = []

	let AUXES: any[] = []

	switch (self.config.model) {
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

	AUXES = constants.AUXXPTEffectAddresses

	for (const eff of EFF) {
		for (const bus of BUSSES) {
			const sourceAddress = self.DATA[eff.id]?.[bus.id]
			const sourceName = SOURCES.find((source) => source.id === sourceAddress)?.label
			if (sourceAddress && sourceName) {
				variableObj[`${eff.id}_${bus.id}`] = sourceName
			} else {
				self.log('debug', `CheckVariables: No source found for ${eff.id}_${bus.id}`)
			}
		}
	}

	for (const aux of AUXES) {
		const sourceAddress = self.DATA[aux.id]
		const sourceName = SOURCES.find((source) => source.id === sourceAddress)?.label
		if (sourceAddress && sourceName) {
			variableObj[`${aux.id}`] = sourceName
		} else {
			self.log('debug', `CheckVariables: No source found for ${aux.id}`)
		}
	}
}
