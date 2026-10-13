import withWorkspaceChanges from './diff.js';
import { agentEnvironment } from './environment.js';
import { workspace } from './paths.js';

/**
 * Options shared by every evaluation case.
 */
export default {
	options: {
		// Prepended to every task to prevent the agent from wasting tokens
		// trying to boot an environment the workspace does not have.
		prefix: `This task runs in an isolated evaluation workspace and
npm is not available. Do not try to build. Do not start or try to start wp-env,
wp-env-test, Docker, development servers, or other long-running services.
Accomplish your requested task and I will run and test the build on my own
environment.`,

		// Hands every assertion the agent's changes alongside its response, so
		// a rubric can judge the diff instead of the agent's summary of it.
		transform: withWorkspaceChanges,

		// Grades `agent-rubric` assertions. Naming `working_dir` and nothing
		// else is Promptfoo's documented grader. The grader is
		// confined without a sandbox and has no shell access.
		provider: {
			id: 'anthropic:claude-agent-sdk',
			config: {
				apiKeyRequired: false,
				model: 'opus',
				working_dir: workspace,
				// Left unset, every settings source is loaded, which would put
				// the developer's own ~/.claude instructions into the grader's
				// context and make a grade depend on whose machine it ran on.
				setting_sources: [],
				// No settings sources means no hooks to load; saying so makes
				// the guarantee explicit rather than a consequence.
				settings: { disableAllHooks: true },
				// It has no shell to read these with, but that is a property
				// of the current tool list rather than something to depend on.
				env: agentEnvironment,
			},
		},
	},
};
