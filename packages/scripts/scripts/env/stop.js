/**
 * Node dependencies.
 */
const { execSync } = require( 'child_process' );
const { env } = require( 'process' );

// Stop the environment in the WordPress directory.
execSync( 'npm run env:stop', { cwd: env.WP_DEVELOP_DIR, stdio: 'inherit' } );
