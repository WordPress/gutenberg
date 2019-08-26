/**
 * Node dependencies.
 */
const { execSync } = require( 'child_process' );
const { env } = require( 'process' );

/**
 * Internal dependencies
 */
const { getArgsFromCLI } = require( '../../utils' );

const args = getArgsFromCLI();

const localDir = env.LOCAL_DIR || 'src';

// Execute any docker-compose command passed to this script, in the WordPress Docker environment.
execSync( `docker-compose run -w /var/www/${ localDir }/wp-content/plugins/${ env.npm_package_wp_env_plugin_dir } --rm ` + args.join( ' ' ), { cwd: env.WP_DEVELOP_DIR, stdio: 'inherit' } );
