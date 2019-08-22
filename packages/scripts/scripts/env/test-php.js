/**
 * Node dependencies.
 */
const { execSync } = require( 'child_process' );
const { env } = require( 'process' );
const { normalize } = require( 'path' );
const { existsSync } = require( 'fs' );

/**
 * Internal dependencies
 */
const { getArgsFromCLI } = require( '../../utils' );

const args = getArgsFromCLI();

const localDir = env.LOCAL_DIR || 'src';

let buildConfig = '';
if ( localDir === 'build' && existsSync( 'phpunit/build-dir.php' ) ) {
	buildConfig = `--prepend /var/www/${ localDir }/wp-content/plugins/${ env.npm_package_wp_env_plugin_dir }/phpunit/build-dir.php`;
}

// Run PHPUnit with the working directory set correctly.
execSync( `npm run test:php -- -c /var/www/${ localDir }/wp-content/plugins/${ env.npm_package_wp_env_plugin_dir }/phpunit.xml.dist ${ buildConfig } ` + args.join( ' ' ), { cwd: normalize( env.WP_DEVELOP_DIR ), stdio: 'inherit' } );
