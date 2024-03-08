import { Regex, type SomeCompanionConfigField } from '@companion-module/base'

export interface ModuleConfig {
	host: string
	port: number
	model: string,
	advanced: boolean,
	pollInterval: number,
	isVisible: boolean
}

export function GetConfigFields(): SomeCompanionConfigField[] {
	return [
		{
			type: 'static-text',
			id: 'info',
			label: 'Information',
			width: 12,
			value: 'This module is for controlling Sony XVS series switchers.',
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
			default: 8000,
		},
		{
			type: 'dropdown',
			id: 'model',
			label: 'Model',
			width: 8,
			default: 'xvs-9000',
			choices: [
				{ id: 'xvs-9000', label: 'XVS 9000/8000/7000/6000' },
				{ id: 'xvsg1', label: 'XVS-G1' },
				{ id: 'mlsx1', label: 'MLS-X1' }
			],
		},
		{
			type: 'static-text',
			id: 'advancedSeperator',
			label: '',
			width: 12,
			value: '<hr />'
		},
		{
			type: 'checkbox',
			id: 'advanced',
			label: 'Advanced settings',
			width: 12,
			default: false
		},
		{
			type: 'number',
			id: 'pollInterval',
			label: 'Polling Interval (ms)',
			width: 4,
			min: 100,
			max: 60000,
			default: 500,
			isVisible: (options) => !!options['advanced']
		}
	]
}
