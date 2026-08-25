/**
 * Setup shared by every evaluation spec.
 */
import defaultTest from './default-test.js';

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
	// export for beforeAll, beforeEach, afterEach and afterAll; ours builds a
	// disposable repository for each row and deletes it afterwards.
	extensions: [ 'file://../../lib/workspace-extension.mjs:extensionHook' ],

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
				// Only project-level instructions, so the developer's own
				// ~/.claude guidance cannot leak into the subject.
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
				// We want to limit the test to only accessing the repo.
				disallowed_tools: [ 'WebFetch', 'WebSearch' ],
				// Points Docker at a socket that does not exist, so `docker`
				// and `wp-env` fail instead of starting containers, which the
				// sandbox cannot reach to clean up.
				env: { DOCKER_HOST: 'unix:///nonexistent/docker.sock' },
			},
		},
	],

	// Merged into every case: the sandbox the agent runs in, the preamble added
	// to each prompt, and the provider that grades `agent-rubric` assertions.
	defaultTest,

	// Run-level controls.
	evaluateOptions: {
		timeoutMs: 180000,
		cache: false,
		maxConcurrency: 2,
		repeat: 2,
	},

	outputPath: 'results/raw/latest.json',
};
