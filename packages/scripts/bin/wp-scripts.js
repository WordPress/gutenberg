#!/usr/bin/env node

const spawn = require( 'cross-spawn' );

const allowedScripts = [ 'test' ];
const [ scriptName, ...nodeArgs ] = process.argv.slice( 2 );

if ( allowedScripts.indexOf( scriptName ) === -1 ) {
	console.log( 'Unknown script "' + scriptName + '".' );
	console.log( 'Perhaps you need to update @wordpress/scripts?' );
	process.exit( 1 );
}

const result = spawn.sync(
	'node',
	[
		require.resolve( `../scripts/${ scriptName }-script`  ),
		...nodeArgs
	],
	{ stdio: 'inherit' }
);
if ( result.signal ) {
	if ( result.signal === 'SIGKILL' ) {
		console.log(
			'The build failed because the process exited too early. ' +
			'This probably means the system ran out of memory or someone called ' +
			'`kill -9` on the process.'
		);
	} else if ( result.signal === 'SIGTERM' ) {
		console.log(
			'The build failed because the process exited too early. ' +
			'Someone might have called `kill` or `killall`, or the system could ' +
			'be shutting down.'
		);
	}
	process.exit( 1 );
}
process.exit( result.status );
