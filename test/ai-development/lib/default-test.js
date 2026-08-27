import withWorkspaceChanges from './diff.js';
import { workspace } from './paths.js';

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

		// Hands every assertion the agent's changes alongside its response, so
		// a rubric can judge the diff instead of the agent's summary of it.
		transform: withWorkspaceChanges,

		// Grades `agent-rubric` assertions. Naming `working_dir` and nothing
		// else is Promptfoo's documented grader: it applies its default
		// allowlist of Read, Grep, Glob and LS, which is read-only, and the
		// SDK refuses any path outside the working directory. So the grader is
		// confined without a sandbox — the sandbox only wraps Bash, and a
		// grader with no Bash has nothing for it to wrap.
		//
		// Having no shell is also why the transform above matters: the grader
		// cannot run `git diff` for itself, so the transform shows it what
		// changed, and its read-only tools let it check that against the
		// repository's own references.
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
			},
		},
	},
};
