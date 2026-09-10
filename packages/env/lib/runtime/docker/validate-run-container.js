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
	'phpmyadmin',
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

module.exports = {
	RUN_CONTAINERS,
	validateRunContainer,
};
