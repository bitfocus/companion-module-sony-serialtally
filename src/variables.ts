import type { xvsInstance } from './main.js'
import {
	MEXPTEffectAddresses,
	BUSSES,
	AUXXPTEffectAddresses,
	FMXPTEffectAddresses,
	Source,
	SOURCES,
	GPI,
	GPO,
	TALLY_GROUPS,
	TALLY_COLORS,
	tallyKey,
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

	for (const source of SOURCES[self.config.model]) {
		variables.push({
			name: `${source.label} Name`,
			variableId: `source_${source.id}`,
		})
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

	for (const gpi of GPI) {
		variables.push({
			name: `${gpi.label} State`,
			variableId: `${gpi.id}`,
		})
	}

	for (const gpo of GPO) {
		variables.push({
			name: `${gpo.label} State`,
			variableId: `${gpo.id}`,
		})
	}

	//tally variables are only defined when tally is enabled in config
	if (self.config.tallyDataSize === '128' || self.config.tallyDataSize === '256') {
		//tally: per group/color list of tallied source names + a count
		for (const group of TALLY_GROUPS) {
			for (const color of TALLY_COLORS) {
				variables.push({
					name: `Tally ${group.label} ${color.label} - Sources`,
					variableId: `tally_${group.id}_${color.id}`,
				})
				variables.push({
					name: `Tally ${group.label} ${color.label} - Count`,
					variableId: `tally_${group.id}_${color.id}_count`,
				})
			}
		}

		//tally: per source, the group/colors it is currently tallied in
		for (const source of SOURCES[self.config.model]) {
			variables.push({
				name: `${source.label} Tally`,
				variableId: `source_${source.id}_tally`,
			})
		}
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

				//check to see if there's a discovered source name instead of just the default one, and replace it with that, if so
				const sourceNameObj = self.DATA.sourceNames.find((obj: { id: number }) => obj.id === sourceAddress)
				if (sourceNameObj) {
					variableObj[`${eff.id}_${bus.id}`] = sourceNameObj.name
				}
			} else {
				self.logVerbose(`UpdateVariableValues: No source found for ${eff.id}_${bus.id}`)
			}
		}
	}

	for (const source of SOURCES[self.config.model]) {
		const sourceNameObj = self.DATA.sourceNames.find((obj: { id: number }) => obj.id === source.id)
		if (sourceNameObj && sourceNameObj.name) {
			variableObj[`source_${source.id}`] = sourceNameObj.name
		} else {
			variableObj[`source_${source.id}`] = source.label
		}
	}

	for (const aux of AUXXPTEffectAddresses) {
		const sourceAddress = self.DATA.xpt[aux.id]
		const sourceName = SOURCES[self.config.model].find((source: Source) => source.id === sourceAddress)?.label
		if (sourceAddress && sourceName) {
			variableObj[`${aux.id}`] = sourceName

			//check to see if there's a discovered source name instead of just the default one, and replace it with that, if so
			const sourceNameObj = self.DATA.sourceNames.find((obj: { id: number }) => obj.id === sourceAddress)
			if (sourceNameObj) {
				variableObj[`${aux.id}`] = sourceNameObj.name
			}
		} else {
			self.logVerbose(`UpdateVariableValues: No source found for ${aux.id}`)
		}
	}

	for (const fm of FMXPTEffectAddresses) {
		const sourceAddress = self.DATA.xpt[fm.id]
		const sourceName = SOURCES[self.config.model].find((source: Source) => source.id === sourceAddress)?.label
		if (sourceAddress && sourceName) {
			variableObj[`${fm.id}`] = sourceName

			//check to see if there's a discovered source name instead of just the default one, and replace it with that, if so
			const sourceNameObj = self.DATA.sourceNames.find((obj: { id: number }) => obj.id === sourceAddress)
			if (sourceNameObj) {
				variableObj[`${fm.id}`] = sourceNameObj.name
			}
		} else {
			self.logVerbose(`UpdateVariableValues: No source found for ${fm.id}`)
		}
	}

	for (const gpi of GPI) {
		const state = self.DATA.gpi?.[gpi.id] ?? null
		variableObj[`${gpi.id}`] = state ? 'On' : 'Off'
	}

	for (const gpo of GPO) {
		const state = self.DATA.gpo?.[gpo.id] ?? null
		variableObj[`${gpo.id}`] = state ? 'On' : 'Off'
	}

	//tally values are only set when tally is enabled in config
	if (self.config.tallyDataSize === '128' || self.config.tallyDataSize === '256') {
		const tally = self.DATA.tally ?? {}

		//resolve a source id to its display name (discovered name preferred, then label)
		const sourceDisplayName = (id: number): string => {
			const sourceNameObj = self.DATA.sourceNames.find((obj: { id: number }) => obj.id === id)
			if (sourceNameObj && sourceNameObj.name) {
				return sourceNameObj.name
			}
			const source = SOURCES[self.config.model].find((s: Source) => s.id === id)
			return source ? source.label : `Source ${id}`
		}

		//per group/color: comma-separated list of tallied source names + count
		for (const group of TALLY_GROUPS) {
			for (const color of TALLY_COLORS) {
				const set: Set<number> | undefined = tally[tallyKey(group.id, color.id)]
				const ids = set ? Array.from(set).sort((a, b) => a - b) : []
				variableObj[`tally_${group.id}_${color.id}`] = ids.map(sourceDisplayName).join(', ')
				variableObj[`tally_${group.id}_${color.id}_count`] = ids.length
			}
		}

		//per source: which group/colors it is tallied in (empty when not tallied)
		for (const source of SOURCES[self.config.model]) {
			const memberships: string[] = []
			for (const group of TALLY_GROUPS) {
				for (const color of TALLY_COLORS) {
					const set: Set<number> | undefined = tally[tallyKey(group.id, color.id)]
					if (set && set.has(source.id)) {
						memberships.push(`${group.label} ${color.label}`)
					}
				}
			}
			variableObj[`source_${source.id}_tally`] = memberships.join(', ')
		}
	}

	self.setVariableValues(variableObj)
}
