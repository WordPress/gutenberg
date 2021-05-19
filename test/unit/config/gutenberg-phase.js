global.process.env = {
	...global.process.env,
	// Inject the `GUTENBERG_PHASE` global, used for feature flagging.
	// eslint-disable-next-line @wordpress/gutenberg-phase
	GUTENBERG_PHASE: parseInt(
		process.env.npm_package_config_GUTENBERG_PHASE,
		10
	),
};
