import type { xvsInstance } from './main.js'
import { CompanionActionDefinitions, CompanionInputFieldCheckbox } from '@companion-module/base'
import * as constants from './constants.js'
import {
	xptME,
	xptAUX,
	transitionME,
	transitionMECancel,
	keyOnOff,
	recallSnapshot,
	macroRecall,
	macroTake,
} from './api.js'

export function UpdateActions(self: xvsInstance): void {
	const actions: CompanionActionDefinitions = {}

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

	actions.xptME = {
		name: 'XPT: M/E',
		options: [
			{
				type: 'dropdown',
				id: 'eff',
				label: 'M/E Selection',
				default: constants.MEXPTEffectAddresses[0].id,
				choices: constants.MEXPTEffectAddresses,
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
			},
		],
		callback: async (event) => {
			const eff: any = event.options.eff
			const bus: any = event.options.bus
			const source: any = event.options.source
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
			},
		],
		callback: async (event) => {
			const aux: any = event.options.aux
			const source: any = event.options.source
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
				default: constants.MEXPTEffectAddresses[0].id,
				choices: constants.MEXPTEffectAddresses,
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
			},
		],
		callback: async (event) => {
			const eff: any = event.options.eff
			const cmd: any = event.options.cmd
			const transRate: any = event.options.transRate
			transitionME(self, eff, cmd, transRate)
		},
	}

	actions.transitionMECancel = {
		name: 'Transition M/E Cancel',
		options: [
			{
				type: 'dropdown',
				id: 'eff',
				label: 'M/E Selection',
				default: constants.MEXPTEffectAddresses[0].id,
				choices: constants.MEXPTEffectAddresses,
			},
			{
				type: 'dropdown',
				id: 'cmd',
				label: 'Command',
				default: constants.AUTOTRANSITION_EFF[0].id,
				choices: constants.AUTOTRANSITION_EFF,
			},
		],
		callback: async (event) => {
			const eff: any = event.options.eff
			const cmd: any = event.options.cmd
			transitionMECancel(self, eff, cmd)
		},
	}

	actions.keyOnOff = {
		name: 'Key On/Off',
		options: [
			{
				type: 'dropdown',
				id: 'eff',
				label: 'M/E Selection',
				default: constants.MEXPTEffectAddresses[0].id,
				choices: constants.MEXPTEffectAddresses,
			},
			{
				type: 'dropdown',
				id: 'key',
				label: 'Key Number',
				default: constants.KEYS[0].id,
				choices: constants.KEYS,
			},
			{
				type: 'dropdown',
				id: 'onoff',
				label: 'On/Off',
				default: 'on',
				choices: [
					{ id: 'on', label: 'On' },
					{ id: 'off', label: 'Off' },
				],
			},
		],
		callback: async (event) => {
			const eff: any = event.options.eff
			const cmd: any = event.options.cmd
			const key: any = event.options.key
			keyOnOff(self, eff, key, cmd)
		},
	}

	const reversedEFF = constants.MEXPTEffectAddresses.slice().reverse()

	actions.recallSnapshot = {
		name: 'Recall Snapshot',
		options: [],
		callback: async (event) => {
			const regionSelectPart1: string[] = []
			const registerNumber: any = event.options.registerNumber
			const regionSelectPart2: number[] = []
			const regionSelectPart3: string[] = []

			for (const eff of reversedEFF) {
				if (event.options[`regionSelect_part1_${eff.id}`]) {
					regionSelectPart1.push(eff.id)
				}
			}

			for (let i = 8; i > 0; i--) {
				if (event.options[`regionSelect_part2_${i}`]) {
					regionSelectPart2.push(i)
				}
			}

			for (const eff of reversedEFF) {
				if (event.options[`regionSelect_part3_${eff.id}`]) {
					regionSelectPart3.push(eff.id)
				}
			}

			recallSnapshot(self, regionSelectPart1, registerNumber, regionSelectPart2, regionSelectPart3)
		},
	}

	for (const eff of reversedEFF) {
		//build an array of checkboxes for each EFF to push into the options for Region Select Part 1
		const regionOption: CompanionInputFieldCheckbox = {
			type: 'checkbox',
			id: `regionSelect_part1_${eff.id}`,
			label: `Region Select Part 1 - ${eff.label}`,
			default: false,
		}
		actions.recallSnapshot.options.push(regionOption)
	}

	//now add register number
	actions.recallSnapshot.options.push({
		type: 'number',
		id: 'registerNumber',
		label: 'Register Number',
		default: 1,
		min: 1,
		max: 99,
	})

	//now add region select part 2, user 8-user 1
	for (let i = 8; i > 0; i--) {
		const regionOption: CompanionInputFieldCheckbox = {
			type: 'checkbox',
			id: `regionSelect_part2_${i}`,
			label: `Region Select Part 2 - User ${i}`,
			default: false,
		}
		actions.recallSnapshot.options.push(regionOption)
	}

	//now add region select part 3, reversed EFF again with 'SUB' added at the end of each name
	for (const eff of reversedEFF) {
		const regionOption: CompanionInputFieldCheckbox = {
			type: 'checkbox',
			id: `regionSelect_part3_${eff.id}`,
			label: `Region Select Part 3 - ${eff.label} SUB`,
			default: false,
		}
		actions.recallSnapshot.options.push(regionOption)
	}

	actions.macroRecall = {
		name: 'Macro Recall',
		options: [
			{
				type: 'number',
				id: 'macroNumber',
				label: 'Macro Register Number',
				default: 1,
				min: 1,
				max: 999,
			},
		],
		callback: async (event) => {
			const macroNumber: any = event.options.macroNumber
			macroRecall(self, macroNumber)
		},
	}

	actions.macroTake = {
		name: 'Macro Take',
		options: [],
		callback: async () => {
			macroTake(self)
		},
	}

	self.setActionDefinitions(actions)
}
