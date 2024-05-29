/*
 * Feature flag guarding features specific to WordPress core.
 * It's important to set it to "true" in the test environment
 * to ensure the Gutenberg plugin can be cleanly merged into
 * WordPress core.
 */
// eslint-disable-next-line @wordpress/wp-global-usage
globalThis.IS_WORDPRESS_CORE = true;

// Inject the `IS_GUTENBERG_PLUGIN` global, used for feature flagging.
// eslint-disable-next-line @wordpress/wp-global-usage
globalThis.IS_GUTENBERG_PLUGIN =
	String( process.env.npm_package_config_IS_GUTENBERG_PLUGIN ) === 'true';
