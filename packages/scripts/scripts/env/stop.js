
/**
 * Node dependencies.
 */
const { execSync } = require( 'child_process' );
const { env } = require( 'process' );
const { normalize } = require( 'path' );

// Stop the environment in the WordPress directory.
execSync( 'npm run env:stop', { cwd: normalize( env.WP_DEVELOP_DIR ), stdio: 'inherit' } );
