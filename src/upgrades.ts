import type {
	CompanionStaticUpgradeScript,
	CompanionStaticUpgradeProps,
	CompanionStaticUpgradeResult,
	CompanionUpgradeContext,
} from '@companion-module/base'
import type { ModuleConfig } from './config.js'

export const UpgradeScripts: CompanionStaticUpgradeScript<ModuleConfig>[] = [
	function (
		_context: CompanionUpgradeContext<ModuleConfig>,
		props: CompanionStaticUpgradeProps<ModuleConfig>,
	): CompanionStaticUpgradeResult<ModuleConfig> {
		const config = props.config
		if (config && config.tallyDataSize === undefined) {
			config.tallyDataSize = 'off'
			return {
				updatedConfig: config,
				updatedActions: [],
				updatedFeedbacks: [],
			}
		}
		return {
			updatedConfig: null,
			updatedActions: [],
			updatedFeedbacks: [],
		}
	},
]
