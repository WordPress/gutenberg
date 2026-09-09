const { x } = require( 'tinyexec' );
const { info } = require( './log' );

module.exports = async ( { rootDirectory } ) => {
	info( '' );
	info(
		'Installing `@wordpress/scripts` package. It might take a couple of minutes...'
	);
	await x( 'npm', [ 'install', '@wordpress/scripts', '--save-dev' ], {
		throwOnError: true,
		nodeOptions: { cwd: rootDirectory },
	} );

	info( '' );
	info( 'Formatting JavaScript files.' );
	await x( 'npm', [ 'run', 'format' ], {
		throwOnError: true,
		nodeOptions: { cwd: rootDirectory },
	} );

	info( '' );
	info( 'Compiling block and generating blocks manifest.' );
	await x( 'npm', [ 'run', 'build' ], {
		throwOnError: true,
		nodeOptions: { cwd: rootDirectory },
	} );
};
