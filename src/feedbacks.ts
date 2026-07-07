import { combineRgb, CompanionFeedbackDefinitions } from '@companion-module/base'
import type { xvsInstance } from './main.js'
import {
	MEXPTEffectAddresses,
	BUSSES,
	AUXXPTEffectAddresses,
	FMXPTEffectAddresses,
	Source,
	SOURCES,
	TALLY_GROUPS,
	TALLY_COLORS,
	TallyColor,
	tallyKey,
} from './constants.js'

export function UpdateFeedbacks(self: xvsInstance): void {
	const feedbacks: CompanionFeedbackDefinitions = {}

	feedbacks.xptMEState = {
		name: 'Selected Source is on Selected Bus of M/E',
		type: 'boolean',
		defaultStyle: {
			bgcolor: combineRgb(255, 0, 0),
			color: combineRgb(0, 0, 0),
		},
		options: [
			{
				type: 'dropdown',
				id: 'eff',
				label: 'M/E Selection',
				default: MEXPTEffectAddresses[0].id,
				choices: MEXPTEffectAddresses,
			},
			{
				type: 'dropdown',
				id: 'bus',
				label: 'Bus Selection',
				default: BUSSES[self.config.model][0].id,
				choices: BUSSES[self.config.model],
			},
			{
				type: 'dropdown',
				id: 'source',
				label: 'Source Selection',
				default: SOURCES[self.config.model][0].id,
				choices: SOURCES[self.config.model],
			},
		],
		callback: (feedback) => {
			const eff: any = feedback.options.eff
			const bus: any = feedback.options.bus
			const source: any = feedback.options.source

			if (self.DATA.xpt[eff] && self.DATA.xpt[eff][bus]) {
				if (self.DATA.xpt[eff][bus] == source) {
					return true
				}
			}

			return false
		},
	}

	feedbacks.xptAUXState = {
		name: 'Selected Source is on Selected Aux',
		type: 'boolean',
		defaultStyle: {
			bgcolor: combineRgb(255, 0, 0),
			color: combineRgb(0, 0, 0),
		},
		options: [
			{
				type: 'dropdown',
				id: 'aux',
				label: 'Aux Selection',
				default: AUXXPTEffectAddresses[0].id,
				choices: AUXXPTEffectAddresses,
			},
			{
				type: 'dropdown',
				id: 'source',
				label: 'Source Selection',
				default: SOURCES[self.config.model][0].id,
				choices: SOURCES[self.config.model],
			},
		],
		callback: (feedback) => {
			const aux: any = feedback.options.aux
			const source: any = feedback.options.source

			if (self.DATA.xpt[aux] == source) {
				return true
			}

			return false
		},
	}

	feedbacks.xptFMState = {
		name: 'Selected Source is on Selected FM',
		type: 'boolean',
		defaultStyle: {
			bgcolor: combineRgb(255, 0, 0),
			color: combineRgb(0, 0, 0),
		},
		options: [
			{
				type: 'dropdown',
				id: 'fm',
				label: 'FM Selection',
				default: FMXPTEffectAddresses[0].id,
				choices: FMXPTEffectAddresses,
			},
			{
				type: 'dropdown',
				id: 'source',
				label: 'Source Selection',
				default: SOURCES[self.config.model][0].id,
				choices: SOURCES[self.config.model],
			},
		],
		callback: (feedback) => {
			const fm: any = feedback.options.fm
			const source: any = feedback.options.source

			if (self.DATA.xpt[fm] == source) {
				return true
			}

			return false
		},
	}

	if (self.config.tallyDataSize === '128' || self.config.tallyDataSize === '256') {
		//source list including discovered names, for the tally source picker
		const listSOURCES: Source[] = SOURCES[self.config.model].map((source: Source) => {
			const found = self.DATA.sourceNames.find((obj: { id: number }) => obj.id === source.id)
			if (found && found.name) {
				return { ...source, label: `${source.label} (${found.name})` }
			}
			return source
		})

		feedbacks.tallySource = {
			name: 'Selected Source Tally State',
			type: 'boolean',
			defaultStyle: {
				bgcolor: combineRgb(255, 0, 0),
				color: combineRgb(0, 0, 0),
			},
			options: [
				{
					type: 'dropdown',
					id: 'source',
					label: 'Source Selection',
					default: listSOURCES[0].id,
					choices: listSOURCES,
				},
				{
					type: 'dropdown',
					id: 'group',
					label: 'Tally Group',
					default: 'any',
					choices: [{ id: 'any', label: 'Any Group' }, ...TALLY_GROUPS],
				},
				{
					type: 'dropdown',
					id: 'color',
					label: 'Tally Color',
					default: 'red',
					choices: [{ id: 'any', label: 'Any Color' }, ...TALLY_COLORS],
				},
			],
			callback: (feedback) => {
				const sourceId = Number(feedback.options.source)
				const group = String(feedback.options.group)
				const color = String(feedback.options.color)

				const groups = group === 'any' ? TALLY_GROUPS.map((g) => g.id) : [group]
				const colors: TallyColor[] = color === 'any' ? TALLY_COLORS.map((c) => c.id) : [color as TallyColor]

				for (const g of groups) {
					for (const c of colors) {
						const set: Set<number> | undefined = self.DATA.tally[tallyKey(g, c)]
						if (set && set.has(sourceId)) {
							return true
						}
					}
				}

				return false
			},
		}
	}

	self.setFeedbackDefinitions(feedbacks)
}
