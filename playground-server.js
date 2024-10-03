/**
 * External dependencies
 */
const { spawn } = require( 'child_process' );

const wpServer = spawn(
	'npx',
	[
		'@wp-playground/cli',
		'server',
		'--wp=nightly',
		'--mount=./:/wordpress/wp-content/plugins/gutenberg',
		'--mount=./test/emptytheme:/wordpress/wp-content/themes/emptytheme',
		'--mount=./test/gutenberg-test-themes:/wordpress/wp-content/themes/gutenberg-test-themes',
		'--mount=./packages/e2e-tests/mu-plugins:/wordpress/wp-content/mu-plugins',
		'--mount=./packages/e2e-tests/plugins:/wordpress/wp-content/plugins/gutenberg-test-plugins',
		'--blueprint=./test/e2e/playground.blueprint.json',
	],
	{
		detached: true,
		stdio: [ 'ignore', 'pipe', 'pipe' ], // Capture stdout and stderr
	}
);

// Listen to stdout and wait for the "WordPress is running" message
wpServer.stdout.on( 'data', ( data ) => {
	const output = data.toString().trim();

	if ( output && ! output.endsWith( '%' ) ) {
		// eslint-disable-next-line no-console
		console.log( output ); // Optional: log the output
	}

	if ( output.includes( 'WordPress is running' ) ) {
		process.exit( 0 ); // Exit the Node.js process once the server is provisioned
	}
} );

wpServer.stderr.on( 'data', ( data ) => {
	// eslint-disable-next-line no-console
	console.error( data.toString() );
} );

wpServer.on( 'close', ( code ) => {
	if ( code !== 0 ) {
		process.exit( 0 );
	}
} );
