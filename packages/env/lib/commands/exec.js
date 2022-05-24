/**
 * Internal dependencies
 */
const initConfig = require( '../init-config' );
const spawnDockerComposeRunCommand = require( '../spawn-docker-compose-run-command' );

/**
 * @typedef {import('../config').Config} Config
 */

/**
 * Runs a script in the given environment.
 *
 * @param {Object}   options
 * @param {string}   options.environment The environment to run the script in.
 * @param {string[]} options.script      The script to run.
 * @param {string[]} options.scriptArgs  The arguments to pass to the script.
 * @param {boolean}  options.debug       True if debug mode is enabled.
 * @param {Object}   options.spinner     A CLI spinner which indicates progress.
 */
module.exports = async function run( {
	environment,
	script,
	scriptArgs,
	spinner,
	debug,
} ) {
	const config = await initConfig( { spinner, debug } );

	// We want the script from the correct environment so that we can execute it.
	const envConfig = config.env[ environment ];
	if ( ! envConfig ) {
		spinner.fail(
			`The environment '${ environment }' could not be found.`
		);
		return;
	}
	const execScript = envConfig.scripts[ script ];
	if ( ! execScript ) {
		spinner.fail(
			`The environment '${ environment }' has no script named '${ script }'.`
		);
		return;
	}

	// Figure out the working directory for the command to be executed in.
	let workingDir = execScript.cwd;
	if ( workingDir && ! workingDir.startsWith( '/' ) ) {
		workingDir = '/var/www/html/' + workingDir;
	}

	// We're going to run the script in the selected container.
	const container = environment === 'tests' ? 'tests-wordpress' : 'wordpress';
	const spawnCommand = execScript.script + ' ' + scriptArgs.join( ' ' );

	if ( debug ) {
		spinner.info(
			`Starting script "${ script }" in "${ environment }" with command "${ spawnCommand }".`
		);
	} else {
		spinner.info( `Starting script "${ script }" in "${ environment }".` );
	}

	await spawnDockerComposeRunCommand(
		config,
		container,
		workingDir,
		spawnCommand,
		spinner
	);

	spinner.text = `Ran \`${ script }\` in '${ environment }'.`;
};
