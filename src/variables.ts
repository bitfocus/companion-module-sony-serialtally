import type { xvsInstance } from './main.js'
import { MEXPTEffectAddresses, BUSSES, AUXXPTEffectAddresses, Source, SOURCES } from './constants.js'
import { CompanionVariableValues } from '@companion-module/base'

export function UpdateVariableDefinitions(self: xvsInstance): void {
	const variables = []

	for (const eff of MEXPTEffectAddresses) {
		for (const bus of BUSSES[self.config.model]) {
			variables.push({
				name: `${eff.label} ${bus.label}`,
				variableId: `${eff.id}_${bus.id}`,
			})
		}
	}

	for (const aux of AUXXPTEffectAddresses) {
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

	for (const eff of MEXPTEffectAddresses) {
		for (const bus of BUSSES[self.config.model]) {
			const sourceAddress = self.DATA[eff.id]?.[bus.id]
			const sourceName = SOURCES[self.config.model].find((source: Source) => source.id === sourceAddress)?.label
			if (sourceAddress && sourceName) {
				variableObj[`${eff.id}_${bus.id}`] = sourceName
			} else {
				self.log('debug', `CheckVariables: No source found for ${eff.id}_${bus.id}`)
			}
		}
	}

	for (const aux of AUXXPTEffectAddresses) {
		const sourceAddress = self.DATA.xpt[aux.id]
		const sourceName = SOURCES[self.config.model].find((source: Source) => source.id === sourceAddress)?.label
		if (sourceAddress && sourceName) {
			variableObj[`${aux.id}`] = sourceName
		} else {
			self.log('debug', `CheckVariables: No source found for ${aux.id}`)
		}
	}
}
