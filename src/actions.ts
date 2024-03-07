import type { xvsInstance } from './main.js'
import { CompanionActionDefinition, CompanionActionDefinitions, SomeCompanionConfigField } from '@companion-module/base'
import * as constants from './constants.js'
import { xptME, xptAUX, transitionME} from './api.js'



export function UpdateActions(self: xvsInstance): void {
	let actions: CompanionActionDefinitions = {}

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

	actions.xptME = {
		name: 'XPT: M/E',
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
		callback: async (event) => {
			let eff: any = event.options.eff
			let bus: any = event.options.bus
			let source: any = event.options.source
			xptME(self, eff, bus, source)
		},
	}

	actions.xptAUX = {
		name: 'XPT: AUX',
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
		callback: async (event) => {
			let aux: any = event.options.aux
			let source: any = event.options.source
			xptAUX(self, aux, source)
		},
	}

	actions.transitionME = {
		name: 'Transition M/E',
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
				id: 'cmd',
				label: 'Command',
				default: constants.AUTOTRANSITION_EFF[0].id,
				choices: constants.AUTOTRANSITION_EFF,
			},
			{
				type: 'number',
				id: 'transRate',
				label: 'Transition Rate (frames)',
				default: 30,
				min: 0,
				max: 999,
			}
		],
		callback: async (event) => {
			let eff: any = event.options.eff
			let cmd: any = event.options.cmd
			let transRate: any = event.options.transRate
			transitionME(self, eff, cmd, transRate)
		}
	}

	self.setActionDefinitions(actions)
}
