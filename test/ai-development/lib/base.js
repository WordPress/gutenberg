/**
 * Setup shared by every evaluation spec.
 */
import defaultTest from './default-test.js';
import { agentEnvironment } from './environment.js';
import { workspace } from './paths.js';
import { permissions, sandbox } from './sandbox.js';

/** @type {Partial<import('promptfoo').UnifiedConfig>} */
export default {
	// Lifecycle hooks, as `file://path:exportName`. Promptfoo calls the named
	// export for beforeAll, beforeEach, afterEach and afterAll; ours builds the
	// workspace once, rolls it back between rows, and removes it at the end.
	// Promptfoo resolves these from the config in `specs/<suite>`. A relative
	// path also avoids the drive-letter colon its validator rejects on Windows.
	extensions: [ 'file://../../lib/workspace.mjs:extensionHook' ],

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
				// Hooks are run by Claude Code itself, outside the sandbox
				// that wraps Bash, before the session starts and with the
				// inherited environment. A workspace is built from the tree
				// under evaluation, so a branch that adds `.claude/settings.json`
				// would otherwise run host commands here.
				settings: { permissions, disableAllHooks: true },
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
		// TODO: Allow parallel runs.
		// One row at a time. Every row shares the one workspace, and each starts
		// from the state `afterEach` rolled the last one back to; overlapping
		// rows would reset each other's work mid-run.
		maxConcurrency: 1,
		repeat: 2,
	},

	outputPath: 'results/raw/latest.json',
};
