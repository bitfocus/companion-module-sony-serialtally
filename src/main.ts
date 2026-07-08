import { InstanceBase, runEntrypoint, InstanceStatus, SomeCompanionConfigField } from '@companion-module/base'
import { GetConfigFields, type ModuleConfig } from './config.js'
import { UpdateVariableDefinitions, UpdateVariableValues } from './variables.js'
import { UpgradeScripts } from './upgrades.js'
import { UpdateActions } from './actions.js'
import { UpdateFeedbacks } from './feedbacks.js'
import { UpdatePresets } from './presets.js'
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
		tally: {},
	}

	public xptInterval: NodeJS.Timeout | undefined = undefined
	public sourceNameUpdateTimer: NodeJS.Timeout | undefined = undefined
	public gpioUpdateTimer: NodeJS.Timeout | undefined = undefined

	public INTERVAL_RATE = 500 //ms, how often to update variables and feedbacks, redefinable in config

	public INTERVAL: any = undefined
	public PROTOCOL_STATE: 'IDLE' | 'WAITING' | 'OK' = 'IDLE'

	public incomingData = Buffer.alloc(0)
	public incomingCommandQueue: Array<Buffer> = []
	public outgoingCommandQueue: Array<Buffer> = []
	public outputTimer: NodeJS.Timeout | undefined = undefined

	public reconnectInterval: NodeJS.Timeout | undefined = undefined

	//tracks whether we have reached a connected (ACK received) state, so we only
	//log the "connection refused, will reconnect" notice once per disconnect rather
	//than on every failed reconnect attempt
	public wasConnected: boolean = false

	async init(config: ModuleConfig): Promise<void> {
		await this.configUpdated(config)
	}

	// Debug logging that only fires when verbose logging is enabled in the config.
	// Used for high-frequency messages (incoming data, variable updates) that would
	// otherwise spam the log on every poll cycle.
	logVerbose(message: string): void {
		if (this.config?.verbose) {
			this.log('debug', message)
		}
	}

	// When module gets deleted
	async destroy(): Promise<void> {
		this.log('debug', 'destroy')
		api.stopConnection(this)
	}

	async configUpdated(config: ModuleConfig): Promise<void> {
		this.config = config

		this.updateStatus(InstanceStatus.Connecting)

		this.updateActions() // export actions
		this.updateFeedbacks() // export feedbacks
		this.updatePresets() // export presets
		this.updateVariableDefinitions() // export variable definitions
		this.updateVariableValues() // export variable values

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

	updatePresets(): void {
		UpdatePresets(this)
	}

	updateVariableDefinitions(): void {
		UpdateVariableDefinitions(this)
	}

	updateVariableValues(): void {
		UpdateVariableValues(this)
	}
}

runEntrypoint(xvsInstance, UpgradeScripts)
