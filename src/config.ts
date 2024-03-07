import { Regex, type SomeCompanionConfigField } from '@companion-module/base'

export interface ModuleConfig {
	host: string
	port: number
	model: string
}

export function GetConfigFields(): SomeCompanionConfigField[] {
	return [
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
		}
	]
}
