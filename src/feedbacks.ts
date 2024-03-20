import { combineRgb, CompanionFeedbackDefinitions } from '@companion-module/base'
import type { xvsInstance } from './main.js'
import { MEXPTEffectAddresses, BUSSES, AUXXPTEffectAddresses, Source, SOURCES } from './constants.js'

export function UpdateFeedbacks(self: xvsInstance): void {
	const feedbacks: CompanionFeedbackDefinitions = {}

	//rebuild the SOURCES array to include the label and the source name, if it exists
	const listSOURCES: Source[] = Object.values(SOURCES[self.config.model]).map((source: Source) => {
		const found = self.DATA.sourceNames.find((obj: { id: number }) => obj.id === source.id)
		if (found) {
			source.label = `${source.label} (${found.name})`
		}
		return source
	})

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
				default: listSOURCES[0].id,
				choices: listSOURCES,
			},
		],
		callback: (feedback) => {
			const eff: any = feedback.options.eff
			const bus: any = feedback.options.bus
			const source: any = feedback.options.source

			if (self.DATA.xpt[eff][bus] == source) {
				return true
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
				default: listSOURCES[0].id,
				choices: listSOURCES,
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

	self.setFeedbackDefinitions(feedbacks)
}
