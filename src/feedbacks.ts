import { combineRgb, CompanionFeedbackDefinitions } from '@companion-module/base'
import type { xvsInstance } from './main.js'
import * as constants from './constants.js'

export function UpdateFeedbacks(self: xvsInstance): void {
	let feedbacks: CompanionFeedbackDefinitions = {}

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
				default: constants.EFF[0].id,
				choices: constants.EFF,
			},
			{
				type: 'dropdown',
				id: 'bus',
				label: 'Bus Selection',
				default: BUSSES[0].id,
				choices: BUSSES,
			},
			{
				type: 'dropdown',
				id: 'source',
				label: 'Source Selection',
				default: SOURCES[0].id,
				choices: SOURCES,
			}
		],
		callback: (feedback) => {
			let eff: any = feedback.options.eff
			let bus: any = feedback.options.bus
			let source: any = feedback.options.source
			
			if (self.DATA[eff][bus] == source) {
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
				default: AUXES[0].id,
				choices: AUXES,
			},
			{
				type: 'dropdown',
				id: 'source',
				label: 'Source Selection',
				default: SOURCES[0].id,
				choices: SOURCES,
			}
		],
		callback: (feedback) => {
			let aux: any = feedback.options.aux
			let source: any = feedback.options.source
			
			if (self.DATA[aux] == source) {
				return true
			}

			return false
		},
	}

	self.setFeedbackDefinitions(feedbacks)
}
