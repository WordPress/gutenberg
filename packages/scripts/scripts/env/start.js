
/**
 * Node dependencies
 */
const { execSync } = require( 'child_process' );
const { env, stdout } = require( 'process' );
const { normalize } = require( 'path' );
const { statSync } = require( 'fs' );

/**
 * Internal dependencies
 */
const { getManagedWordPressPath } = require( '../../utils' );

if ( env.MANAGED_WP ) {
	// We're running in our managed WordPress environment, so check if we need to update.
	const stat = statSync( normalize( getManagedWordPressPath() + '/src/wp-config-sample.php' ) );

	const lastUpdated = new Date( stat.mtimeMs );
	if ( Date.now() - lastUpdated.getTime() > 7 * 24 * 60 * 60 * 1000 ) {
		stdout.write( "\nIt's been a while since you updated WordPress. Run `npm run env update` to update it.\n\n" );
	}
}

// Start the environment in the WordPress directory.
execSync( 'npm run env:start', { cwd: env.WP_DEVELOP_DIR, stdio: 'inherit' } );
