/**
 * Node dependencies.
 */
const { execSync } = require( 'child_process' );
const { env } = require( 'process' );

/**
 * WordPress dependencies
 */
const { getArgsFromCLI } = require( '@wordpress/scripts-utils' );

const args = getArgsFromCLI();

const localDir = env.LOCAL_DIR || 'src';

// Run WP-CLI with the working directory set correctly.
execSync(
	`npm run env:cli -- --path=/var/www/${ localDir } ` + args.join( ' ' ),
	{
		cwd: env.WP_DEVELOP_DIR,
		stdio: 'inherit',
	}
);
