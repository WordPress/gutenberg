'use strict';

/**
 * A list of the containers that we can use `run` on.
 */
const RUN_CONTAINERS = [
	'mysql',
	'tests-mysql',
	'wordpress',
	'tests-wordpress',
	'cli',
	'tests-cli',
];

/**
 * Custom parsing and validation for the "run" command's container argument.
 *
 * @param {string} value The user-set container.
 *
 * @return {string} The container name to use.
 */
function validateRunContainer( value ) {
	// Give special errors for deprecated containers.
	if ( value === 'phpunit' ) {
		throw new Error(
			"The 'phpunit' container has been removed. Please use 'wp-env run tests-cli --env-cwd=wp-content/path/to/plugin phpunit' instead."
		);
	}
	if ( value === 'composer' ) {
		throw new Error(
			"The 'composer' container has been removed. Please use 'wp-env run cli --env-cwd=wp-content/path/to/plugin composer' instead."
		);
	}

	return value;
}

/**
 * Custom parsing and validation for the "run" command's command argument.
 *
 * @param {string[]} value The command to run.
 *
 * @return {string[]} The command to run.
 */
function validateRunCommand( value ) {
	// When the command is wrapped in double-quotes it will be given to us as a single argument. This will also happen
	// if the tool is ran without a shell and is explicitly given the entire command in a single argument.
	if ( value.length === 1 && value[ 0 ].includes( ' ' ) ) {
		throw new Error(
			"The entire 'command' argument should not be wrapped in double-quotes as it will be misinterpreted when executed."
		);
	}

	return value;
}

module.exports = {
	RUN_CONTAINERS,
	validateRunContainer,
	validateRunCommand,
};
