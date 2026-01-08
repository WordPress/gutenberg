/**
 * External dependencies
 */
const SimpleGit = require( 'simple-git' );

SimpleGit()
	.diff( [ '-U0' ] )
	.then( ( diff ) => {
		if ( diff ) {
			console.error(
				`There are local changes after running one or more of the following commands:

- pnpm install
- pnpm run docs:build
- pnpm run --filter @wordpress/theme build

Run these commands in your local environment and commit the resulting changes to resolve the issue.
`
			);
			console.log( diff );
			process.exitCode = 1;
		}
	} )
	.catch( ( error ) => {
		console.error(
			'Checking local changes failed!\n\n' + error.toString() + '\n'
		);
		process.exitCode = 1;
	} );
