/**
 * Options shared by every evaluation case.
 */
export default {
	options: {
		// Prevent agent from wasting tokens trying to build
		// or boot an environment the workspace does not have.
		prefix: `This task runs in an isolated evaluation workspace and
npm is not available. Do not try to build. Do not start or try to start wp-env,
wp-env-test, Docker, development servers, or other long-running services.
Accomplish your requested task and I will run and test the build on my own
environment.`,

		// Confines the agent to its workspace and off the network, so it
		// cannot reach this checkout or look up the answer.
		sandbox: {
			enabled: true,
			autoAllowBashIfSandboxed: true,
			allowUnsandboxedCommands: false,
			network: { allowedDomains: [] },
		},

		// Grades the `agent-rubric` assertions. It reads the workspace to
		// judge what the agent actually did, rather than what it reported.
		provider: {
			id: 'anthropic:claude-agent-sdk',
			config: {
				apiKeyRequired: false,
				model: 'opus',
				// The grader inspects the workspace; it never edits it.
				tools: [ 'Bash' ],
				custom_allowed_tools: [ 'Bash' ],
				disallowed_tools: [ 'WebFetch', 'WebSearch' ],
			},
		},
	},
};
