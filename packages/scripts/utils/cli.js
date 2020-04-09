/**
 * External dependencies
 */
const spawn = require( 'cross-spawn' );

/**
 * WordPress dependencies
 */
const { getArgsFromCLI } = require( '@wordpress/scripts-utils' );

/**
 * Internal dependencies
 */
const { exit } = require( './process' );
const { fromScriptsRoot, hasScriptFile, getScripts } = require( './file' );

const getNodeArgsFromCLI = () => {
	const args = getArgsFromCLI();
	const scripts = getScripts();
	const scriptIndex = args.findIndex( ( arg ) => scripts.includes( arg ) );
	return {
		nodeArgs: args.slice( 0, scriptIndex ),
		scriptName: args[ scriptIndex ],
		scriptArgs: args.slice( scriptIndex + 1 ),
	};
};

const handleSignal = ( signal ) => {
	if ( signal === 'SIGKILL' ) {
		// eslint-disable-next-line no-console
		console.log(
			'The script failed because the process exited too early. ' +
				'This probably means the system ran out of memory or someone called ' +
				'`kill -9` on the process.'
		);
	} else if ( signal === 'SIGTERM' ) {
		// eslint-disable-next-line no-console
		console.log(
			'The script failed because the process exited too early. ' +
				'Someone might have called `kill` or `killall`, or the system could ' +
				'be shutting down.'
		);
	}
	exit( 1 );
};

const spawnScript = ( scriptName, args = [], nodeArgs = [] ) => {
	if ( ! scriptName ) {
		// eslint-disable-next-line no-console
		console.log( 'Script name is missing.' );
		exit( 1 );
	}

	if ( ! hasScriptFile( scriptName ) ) {
		// eslint-disable-next-line no-console
		console.log(
			'Unknown script "' +
				scriptName +
				'". ' +
				'Perhaps you need to update @wordpress/scripts?'
		);
		exit( 1 );
	}

	const { signal, status } = spawn.sync(
		'node',
		[ ...nodeArgs, fromScriptsRoot( scriptName ), ...args ],
		{
			stdio: 'inherit',
		}
	);

	if ( signal ) {
		handleSignal( signal );
	}

	exit( status );
};

module.exports = {
	getNodeArgsFromCLI,
	spawnScript,
};
