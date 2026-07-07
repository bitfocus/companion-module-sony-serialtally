import { combineRgb, CompanionPresetDefinitions } from '@companion-module/base'
import type { xvsInstance } from './main.js'
import { MEXPTEffectAddresses, AUXXPTEffectAddresses, SOURCES, Source } from './constants.js'

export function UpdatePresets(self: xvsInstance): void {
	const presets: CompanionPresetDefinitions = {}

	// Rebuild sources array with current custom names, if they exist
	const modelSources = SOURCES[self.config.model] || []
	const listSOURCES: Source[] = modelSources.map((source: Source) => {
		const found = self.DATA.sourceNames.find((obj: { id: number }) => obj.id === source.id)
		if (found && found.name) {
			return { ...source, label: `${source.label} (${found.name})` }
		}
		return source
	})

	//XPT: M/E
	for (const eff of MEXPTEffectAddresses) {
		const category = `XPT M/E: ${eff.label}`
		for (const source of listSOURCES) {
			presets[`xpt_me_${eff.id}_${source.id}`] = {
				type: 'button',
				category,
				name: `M/E ${eff.label} - PGM Source ${source.label}`,
				style: {
					text: `${eff.label}\\n$(self:source_${source.id})`,
					size: 'auto',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(0, 0, 0),
				},
				steps: [
					{
						down: [
							{
								actionId: 'xptME',
								options: {
									eff: eff.id,
									bus: 'pgm',
									source: source.id,
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: 'xptMEState',
						options: {
							eff: eff.id,
							bus: 'pgm',
							source: source.id,
						},
						style: {
							bgcolor: combineRgb(255, 0, 0),
							color: combineRgb(255, 255, 255),
						},
					},
				],
			}
		}
	}

	// AUX sources
	const first5Auxes = AUXXPTEffectAddresses.slice(0, 5)
	for (const aux of first5Auxes) {
		const category = `XPT AUX: ${aux.label}`
		for (const source of listSOURCES) {
			presets[`xpt_aux_${aux.id}_${source.id}`] = {
				type: 'button',
				category,
				name: `${aux.label} - Source ${source.label}`,
				style: {
					text: `${aux.label}\\n$(self:source_${source.id})`,
					size: 'auto',
					color: combineRgb(255, 255, 255),
					bgcolor: combineRgb(0, 0, 0),
				},
				steps: [
					{
						down: [
							{
								actionId: 'xptAUX',
								options: {
									aux: aux.id,
									source: source.id,
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: 'xptAUXState',
						options: {
							aux: aux.id,
							source: source.id,
						},
						style: {
							bgcolor: combineRgb(255, 0, 0),
							color: combineRgb(255, 255, 255),
						},
					},
				],
			}
		}
	}

	// Macros
	const macroCategory = 'Macro'
	for (let i = 1; i <= 10; i++) {
		presets[`macro_recall_${i}`] = {
			type: 'button',
			category: macroCategory,
			name: `Recall Macro ${i}`,
			style: {
				text: `Macro\\n${i}`,
				size: '18',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(0, 0, 0),
			},
			steps: [
				{
					down: [
						{
							actionId: 'macroRecall',
							options: {
								macroNumber: i,
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [],
		}
	}

	presets[`macro_take`] = {
		type: 'button',
		category: macroCategory,
		name: 'Macro Take',
		style: {
			text: `Macro\\nTAKE`,
			size: '18',
			color: combineRgb(255, 255, 255),
			bgcolor: combineRgb(200, 0, 0),
		},
		steps: [
			{
				down: [
					{
						actionId: 'macroTake',
						options: {},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	// Transitions
	const transitionCategory = 'Transition'
	for (const eff of MEXPTEffectAddresses) {
		presets[`transition_me_${eff.id}`] = {
			type: 'button',
			category: transitionCategory,
			name: `Auto Transition M/E ${eff.label}`,
			style: {
				text: `AUTO\\n${eff.label}`,
				size: '18',
				color: combineRgb(255, 255, 255),
				bgcolor: combineRgb(0, 100, 0),
			},
			steps: [
				{
					down: [
						{
							actionId: 'transitionME',
							options: {
								eff: eff.id,
								cmd: 'mp2_main',
								transRate: 30,
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [],
		}
	}

	self.setPresetDefinitions(presets)
}
