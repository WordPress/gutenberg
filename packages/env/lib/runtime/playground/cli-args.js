'use strict';
const { getMountArgs } = require( './blueprint-builder' );

/**
 * Builds command arguments for the Playground CLI server.
 *
 * @param {Object} config        The wp-env config object.
 * @param {string} blueprintPath Path to the generated Blueprint.
 * @return {string[]} Playground CLI arguments.
 */
function getCliArgs( config, blueprintPath ) {
	const envConfig = config.env.development;
	const port = envConfig.port || 8888;
	const phpVersion = envConfig.phpVersion || '8.2';
	const cliArgs = [
		'server',
		'--port',
		String( port ),
		'--php',
		phpVersion,
		'--blueprint',
		blueprintPath,
		'--login',
		...getMountArgs( config ),
	];

	if ( config.debug ) {
		cliArgs.push( '--verbosity', 'debug' );
	}

	if ( envConfig.phpmyadmin ) {
		cliArgs.push( '--phpmyadmin' );
	}

	if ( config.xdebug && config.xdebug !== 'off' ) {
		cliArgs.push( '--xdebug' );
	}

	return cliArgs;
}

module.exports = {
	getCliArgs,
};
