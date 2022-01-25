global.process.env = {
	...global.process.env,
	// Inject the `IS_GUTENBERG_PLUGIN` global, used for feature flagging.
	// eslint-disable-next-line @wordpress/gutenberg-phase
	IS_GUTENBERG_PLUGIN: process.env.npm_package_config_IS_GUTENBERG_PLUGIN,
};
