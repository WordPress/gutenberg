/**
 * Setup shared by every evaluation spec.
 */
import { fileURLToPath } from 'node:url';
import defaultTest from './default-test.js';
import { agentEnvironment } from './environment.js';
import { workspace } from './paths.js';
import { permissions, sandbox } from './sandbox.js';

// Resolved from this file rather than written relative to a spec, so it does
// not depend on which config file pulled the setup in.
const workspaceExtension = fileURLToPath(
	new URL( './workspace.mjs', import.meta.url )
);

/** @type {Partial<import('promptfoo').UnifiedConfig>} */
export default {
	// Promptfoo records an OpenTelemetry trace of each row: the tools the agent
	// invoked and the shell commands it ran. `trajectory:*` assertions match
	// against that trace.
	tracing: {
		enabled: true,
		failOnReceiverStartFailure: true,
		// Claude calls its shell tool Bash, so declare it as a command tool
		// name for Promptfoo's trajectory steps to pick up.
		commandToolNames: [ 'Bash' ],
		otlp: {
			http: {
				enabled: true,
				host: '127.0.0.1',
				port: 4318,
				acceptFormats: [ 'json' ],
			},
		},
	},

	// Lifecycle hooks, as `file://path:exportName`. Promptfoo calls the named
	// export for beforeAll, beforeEach, afterEach and afterAll; ours builds the
	// workspace once, rolls it back between rows, and removes it at the end.
	extensions: [ `file://${ workspaceExtension }:extensionHook` ],

	// The agents under test. Every provider runs every case, so adding one
	// gives a column per agent in the results rather than a separate run.
	providers: [
		{
			id: 'anthropic:claude-agent-sdk',
			label: 'claude',
			config: {
				// Let the Claude CLI use its existing subscription login.
				apiKeyRequired: false,
				model: 'opus',
				max_turns: 30,
				working_dir: workspace,
				// Only project-level instructions, so the developer's own
				// ~/.claude guidance cannot leak into the subject. Project here
				// means the workspace, not this checkout.
				setting_sources: [ 'project' ],
				skills: 'all',
				// Use Bash for reads so Promptfoo represents file access as command
				// trajectory steps, which assertions can match.
				// `custom_allowed_tools` replaces the allowed list outright, so
				// Skill has to appear here for the skills above to be invocable.
				tools: [ 'Bash', 'Edit', 'Write', 'Task', 'Skill' ],
				custom_allowed_tools: [
					'Bash',
					'Edit',
					'Write',
					'Task',
					'Skill',
				],
				// The sandbox's empty domain list only covers Bash and what it
				// starts; these two reach the network on their own.
				disallowed_tools: [ 'WebFetch', 'WebSearch' ],
				sandbox,
				settings: { permissions },
				env: agentEnvironment,
			},
		},
	],

	// Merged into every case: the preamble added to each prompt, and the
	// provider that grades `agent-rubric` assertions.
	defaultTest,

	// Run-level controls.
	evaluateOptions: {
		timeoutMs: 180000,
		cache: false,
		// One row at a time. Every row shares the one workspace, and each starts
		// from the state `afterEach` rolled the last one back to; overlapping
		// rows would reset each other's work mid-run.
		maxConcurrency: 1,
		repeat: 2,
	},

	outputPath: 'results/raw/latest.json',
};
