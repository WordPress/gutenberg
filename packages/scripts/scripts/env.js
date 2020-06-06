/**
 * External dependencies
 */
const chalk = require( 'chalk' );

process.stdout.write(
	chalk.yellow(
		'The `env` family of scripts has been deprecated. Please use `wp-env` instead.'
	)
);
process.stdout.write(
	chalk.blue(
		'\nSee: https://developer.wordpress.org/block-editor/packages/packages-env/\n'
	)
);
process.exit( 1 );
