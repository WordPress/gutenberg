// See https://xdebug.org/docs/all_settings#mode
const XDEBUG_MODES = [
	'develop',
	'coverage',
	'debug',
	'gcstats',
	'profile',
	'trace',
];

/**
 * Custom parsing for the Xdebug mode set via yargs. This function ensures two things:
 * 1. If the --xdebug flag was set by itself, default to 'debug'.
 * 2. If the --xdebug flag includes modes, make sure they are accepted by Xdebug.
 *
 * Note: ideally, we would also have this handle the case where no xdebug flag
 * is set (and then turn Xdebug off). However, yargs does not pass 'undefined'
 * to the coerce callback, so we cannot handle that case here.
 *
 * @param {string} value The user-set mode of Xdebug
 * @return {string} The Xdebug mode to use with defaults applied.
 */
module.exports = function parseXdebugMode( value ) {
	if ( typeof value !== 'string' ) {
		throwXdebugModeError( value );
	}

	if ( value.length === 0 ) {
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
