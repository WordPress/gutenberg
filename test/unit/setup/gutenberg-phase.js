process.env = {
	// eslint-disable-next-line @wordpress/gutenberg-phase
	GUTENBERG_PHASE: parseInt( process.env.npm_package_config_GUTENBERG_PHASE, 10 ),
	...process.env,
};
