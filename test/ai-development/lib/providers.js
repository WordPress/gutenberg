// Coding agents shared by every evaluation spec.
// Claude only for now; a second agent can be added once it has actually been run.
export default [
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
			// Enable every skill the workspace discovers. Omitting this is not
			// "skills off" — it leaves the SDK unconfigured, and the
			// repository's skills then go unlisted, which is indistinguishable
			// from an agent choosing to ignore them.
			skills: 'all',
			// Use Bash for reads so Promptfoo represents file access as command
			// trajectory steps, which assertions can match.
			// `custom_allowed_tools` replaces the allowed list outright, so
			// Skill has to appear here for the skills above to be invocable.
			tools: [ 'Bash', 'Edit', 'Write', 'Task', 'Skill' ],
			custom_allowed_tools: [ 'Bash', 'Edit', 'Write', 'Task', 'Skill' ],
			disallowed_tools: [ 'WebFetch', 'WebSearch' ],
		},
	},
];
