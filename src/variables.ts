import type { xvsInstance } from './main.js'
import {
	MEXPTEffectAddresses,
	BUSSES,
	AUXXPTEffectAddresses,
	FMXPTEffectAddresses,
	Source,
	SOURCES,
} from './constants.js'
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

	for (const fm of FMXPTEffectAddresses) {
		variables.push({
			name: `${fm.label}`,
			variableId: `${fm.id}`,
		})
	}

	self.setVariableDefinitions(variables)
}

export function UpdateVariableValues(self: xvsInstance): void {
	// Check variables

	const variableObj: CompanionVariableValues = {}

	for (const eff of MEXPTEffectAddresses) {
		for (const bus of BUSSES[self.config.model]) {
			const sourceAddress = self.DATA.xpt[eff.id]?.[bus.id]
			const sourceName = SOURCES[self.config.model].find((source: Source) => source.id === sourceAddress)?.label
			if (sourceAddress && sourceName) {
				variableObj[`${eff.id}_${bus.id}`] = sourceName
			} else {
				self.log('debug', `UpdateVariableValues: No source found for ${eff.id}_${bus.id}`)
			}
		}
	}

	for (const aux of AUXXPTEffectAddresses) {
		const sourceAddress = self.DATA.xpt[aux.id]
		const sourceName = SOURCES[self.config.model].find((source: Source) => source.id === sourceAddress)?.label
		if (sourceAddress && sourceName) {
			variableObj[`${aux.id}`] = sourceName
		} else {
			self.log('debug', `UpdateVariableValues: No source found for ${aux.id}`)
		}
	}

	for (const fm of FMXPTEffectAddresses) {
		const sourceAddress = self.DATA.xpt[fm.id]
		const sourceName = SOURCES[self.config.model].find((source: Source) => source.id === sourceAddress)?.label
		if (sourceAddress && sourceName) {
			variableObj[`${fm.id}`] = sourceName
		} else {
			self.log('debug', `UpdateVariableValues: No source found for ${fm.id}`)
		}
	}

	self.setVariableValues(variableObj)
}
