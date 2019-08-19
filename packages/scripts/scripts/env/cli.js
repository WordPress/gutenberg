/**
 * Node dependencies.
 */
const { execSync } = require( 'child_process' );
const { env } = require( 'process' );
const { normalize } = require( 'path' );

/**
 * Internal dependencies
 */
const { getArgsFromCLI } = require( '../../utils' );

const args = getArgsFromCLI();

const localDir = env.LOCAL_DIR || 'src';

// Run PHPUnit with the working directory set correctly.
execSync( `npm run env:cli -- --path=/var/www/${ localDir } ` + args.join( ' ' ), { cwd: normalize( env.WP_DEVELOP_DIR ), stdio: 'inherit' } );
