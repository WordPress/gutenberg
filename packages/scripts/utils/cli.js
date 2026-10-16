const minimist = require( 'minimist' );
const spawn = require( 'cross-spawn' );
const { fromScriptsRoot, hasScriptFile, getScripts } = require( './file' );
const { exit, getArgsFromCLI } = require( './process' );

const getArgFromCLI = ( arg ) => {
	for ( const cliArg of getArgsFromCLI() ) {
		const [ name, value ] = cliArg.split( '=' );
		if ( name === arg ) {
			return value || null;
		}
	}
};

const hasArgInCLI = ( arg ) => getArgFromCLI( arg ) !== undefined;

/**
 * Separates an option of a script from the other CLI arguments, which are
 * passed on to a tool that rejects options it does not know, like Playwright.
 *
 * The option accepts its value either as `<name>=<value>` or as
 * `<name> <value>`. When it is passed more than once, the last value wins.
 *
 * @param {string[]} args CLI arguments.
 * @param {string}   name Name of the option, including the leading dashes.
 *
 * @return {{value: string|null|undefined, args: string[]}} The value of the option, if passed (null when it has no value), and the remaining arguments.
 */
const extractOptionFromArgs = ( args, name ) => {
	let value;
	const remainingArgs = [];
	for ( let i = 0; i < args.length; i++ ) {
		if ( args[ i ] === name ) {
			value = args[ i + 1 ] ?? null;
			i++;
		} else if ( args[ i ].startsWith( `${ name }=` ) ) {
			value = args[ i ].slice( name.length + 1 ) || null;
		} else {
			remainingArgs.push( args[ i ] );
		}
	}
	return { value, args: remainingArgs };
};

// Flags that never take a value, so `--fix file.js` isn't read as `--fix=file.js`.
// stylelint's `--fix` does take an optional mode though, so drop that first.
const getFileArgsFromCLI = () => {
	const args = getArgsFromCLI().filter(
		( arg, index, all ) =>
			! (
				all[ index - 1 ] === '--fix' &&
				[ 'strict', 'lax' ].includes( arg )
			)
	);

	return minimist( args, { boolean: [ 'fix', 'require-pragma' ] } )._;
};

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

const hasFileArgInCLI = () => getFileArgsFromCLI().length > 0;

const handleSignal = ( signal ) => {
	if ( signal === 'SIGKILL' ) {
		console.log(
			'The script failed because the process exited too early. ' +
				'This probably means the system ran out of memory or someone called ' +
				'`kill -9` on the process.'
		);
	} else if ( signal === 'SIGTERM' ) {
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
		console.log( 'Script name is missing.' );
		exit( 1 );
	}

	if ( ! hasScriptFile( scriptName ) ) {
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
	extractOptionFromArgs,
	getArgFromCLI,
	getArgsFromCLI,
	getFileArgsFromCLI,
	getNodeArgsFromCLI,
	hasArgInCLI,
	hasFileArgInCLI,
	spawnScript,
};
