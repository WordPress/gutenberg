/**
 * Node dependencies.
 */
const { execSync } = require( 'child_process' );

// Reset the database.
execSync( 'npm run env cli db reset -- --yes --quiet', { stdio: 'inherit' } );

// Do a fast install, no need to re-run the build commands again.
execSync( 'npm run env install -- --fast', { stdio: 'inherit' } );
