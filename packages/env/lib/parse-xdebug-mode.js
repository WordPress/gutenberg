// See https://xdebug.org/docs/all_settings#mode
const XDEBUG_MODES = [
	'develop',
	'coverage',
	'debug',
	'gcstats',
	'off',
	'profile',
	'trace',
];

/**
 * Custom parsing for the Xdebug mode set via yargs. This function ensures three things:
 * 1. If the --xdebug flag was not set, set it to 'off'.
 * 2. If the --xdebug flag was set by itself, default to 'debug'.
 * 3. If the --xdebug flag includes modes, make sure they are accepted by Xdebug.
 *
 * @param {string|undefined} value The user-set mode of Xdebug; undefined if there is no --xdebug flag.
 * @return {string} The Xdebug mode to use with defaults applied.
 */
module.exports = function parseXdebugMode( value ) {
	if ( value === undefined ) {
		return 'off';
	}
	if ( typeof value !== 'string' ) {
		throwXdebugModeError( value );
	}

	if ( value.length === 0 || value === 'undefined' ) {
		return 'debug';
	}

	const modes = value.split( ',' );
	modes.forEach( ( userMode ) => {
		if ( ! XDEBUG_MODES.some( ( realMode ) => realMode === userMode ) ) {
			throwXdebugModeError( userMode );
		}
	} );
	return value;
};

function throwXdebugModeError( value ) {
	throw new Error(
		`"${ value }" is not a mode recognized by Xdebug. Valid modes are: ${ XDEBUG_MODES.join(
			', '
		) }`
	);
}
