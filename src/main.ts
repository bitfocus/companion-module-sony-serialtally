import { InstanceBase, runEntrypoint, InstanceStatus, SomeCompanionConfigField } from '@companion-module/base'
import { GetConfigFields, type ModuleConfig } from './config.js'
import { UpdateVariableDefinitions, UpdateVariableValues } from './variables.js'
import { UpgradeScripts } from './upgrades.js'
import { UpdateActions } from './actions.js'
import { UpdateFeedbacks } from './feedbacks.js'
import * as api from './api.js'

export class xvsInstance extends InstanceBase<ModuleConfig> {
	config!: ModuleConfig // Setup in init()

	constructor(internal: unknown) {
		super(internal)
	}

	public tcp: any
	public DATA: any = {
		sourceNames: [],
		xpt: [],
	}

	public xptInterval: NodeJS.Timeout | undefined = undefined
	public sourceNameUpdateTimer: NodeJS.Timeout | undefined = undefined
	public gpioUpdateTimer: NodeJS.Timeout | undefined = undefined

	public INTERVAL: any = undefined
	public PROTOCOL_STATE: 'IDLE' | 'WAITING' | 'OK' = 'IDLE'

	public incomingData = Buffer.alloc(0)
	public incomingCommandQueue: Array<Buffer> = []
	public outgoingCommandQueue: Array<Buffer> = []
	public outputTimer: NodeJS.Timeout | undefined = undefined

	public reconnectInterval: NodeJS.Timeout | undefined = undefined

	async init(config: ModuleConfig): Promise<void> {
		await this.configUpdated(config)
	}

	// When module gets deleted
	async destroy(): Promise<void> {
		this.log('debug', 'destroy')
	}

	async configUpdated(config: ModuleConfig): Promise<void> {
		this.config = config

		this.updateStatus(InstanceStatus.Connecting)

		this.updateActions() // export actions
		this.updateFeedbacks() // export feedbacks
		this.updateVariableDefinitions() // export variable definitions

		api.initConnection(this) //setup connection
	}

	// Return config fields for web config
	getConfigFields(): SomeCompanionConfigField[] {
		return GetConfigFields()
	}

	updateActions(): void {
		UpdateActions(this)
	}

	updateFeedbacks(): void {
		UpdateFeedbacks(this)
	}

	updateVariableDefinitions(): void {
		UpdateVariableDefinitions(this)
	}

	updateVariableValues(): void {
		UpdateVariableValues(this)
	}
}

runEntrypoint(xvsInstance, UpgradeScripts)
