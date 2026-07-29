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
globalThis.IS_GUTENBERG_PLUGIN = true;

/*
 * Turn on the `gutenberg-global-styles-inheritance-ui` experiment, which the
 * plugin sets from `lib/experimental/editor-settings.php`. Tests that need the
 * experiment-off behaviour mock `ENABLE_GLOBAL_STYLES_INHERITANCE` instead.
 */
globalThis.__experimentalGlobalStylesInheritanceUI = true;
