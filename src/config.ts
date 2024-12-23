import { Regex, type SomeCompanionConfigField } from '@companion-module/base'
import { Models, MODELS } from './constants.js'

export interface ModuleConfig {
	host: string
	port: number
	model: Models
	advanced: boolean
	allowCustomCommands: boolean
	intervalRate: number
	verbose: boolean
}

export function GetConfigFields(): SomeCompanionConfigField[] {
	return [
		{
			type: 'static-text',
			id: 'info',
			label: 'Information',
			width: 12,
			value: 'This module is for controlling Sony switchers that support the XVS serial tally protocol.',
		},
		{
			type: 'textinput',
			id: 'host',
			label: 'Target IP',
			width: 8,
			regex: Regex.IP,
		},
		{
			type: 'number',
			id: 'port',
			label: 'Target Port',
			width: 4,
			min: 1,
			max: 65535,
			default: 10010,
		},
		{
			type: 'dropdown',
			id: 'model',
			label: 'Model',
			width: 8,
			default: MODELS[0].id,
			choices: MODELS,
		},
		{
			type: 'static-text',
			id: 'advancedSeperator',
			label: '',
			width: 12,
			value: '<hr />',
		},
		{
			type: 'checkbox',
			id: 'advanced',
			label: 'Advanced settings',
			width: 12,
			default: false,
		},
		{
			type: 'checkbox',
			id: 'allowCustomCommands',
			label: 'Allow Custom Commands',
			width: 12,
			default: false,
			isVisible: (options) => !!options['advanced'],
		},
		{
			type: 'number',
			id: 'intervalRate',
			label: 'Update Interval Rate (ms)',
			width: 4,
			min: 100,
			max: 60000,
			default: 500,
			isVisible: (options) => !!options['advanced'],
		},
		{
			type: 'static-text',
			id: 'intervalRateInfo',
			label: '',
			width: 8,
			value: 'This is the interval at which the module will update variables, feedbacks, and other data as it arrives from the switcher.',
			isVisible: (options) => !!options['advanced'],
		},
		{
			type: 'checkbox',
			id: 'verbose',
			label: 'Verbose logging',
			width: 4,
			default: false,
			isVisible: (options) => !!options['advanced'],
		},
		{
			type: 'static-text',
			id: 'verboseInfo',
			label: '',
			width: 8,
			value: 'Enable this to log all commands and responses to the debug log.',
			isVisible: (options) => !!options['advanced'],
		},
	]
}
