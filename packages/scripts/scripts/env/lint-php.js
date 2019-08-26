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

// Run PHPUnit with the working directory set correctly.
execSync( `docker-compose run --rm -w /var/www/${ localDir }/wp-content/plugins/${ env.npm_package_wp_env_plugin_dir } php composer lint ` + args.join( ' ' ), { cwd: env.WP_DEVELOP_DIR, stdio: 'inherit' } );
