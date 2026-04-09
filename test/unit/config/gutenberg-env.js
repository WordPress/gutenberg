/*
 * Feature flag guarding features specific to WordPress core.
 * It's important to set it to "true" in the test environment
 * to ensure the Gutenberg plugin can be cleanly merged into
 * WordPress core.
 */
// eslint-disable-next-line @wordpress/wp-global-usage
globalThis.IS_WORDPRESS_CORE = true;

// Inject IS_GUTENBERG_PLUGIN — read from root package.json directly since
// npm_package_config_* isn't reliable when running via npm workspaces.
const path = require( 'path' );
const rootPackageJson = require(
	path.resolve( __dirname, '../../../package.json' )
);

// eslint-disable-next-line @wordpress/wp-global-usage
globalThis.IS_GUTENBERG_PLUGIN =
	rootPackageJson?.config?.IS_GUTENBERG_PLUGIN === true;
