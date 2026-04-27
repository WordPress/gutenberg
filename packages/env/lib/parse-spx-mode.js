'use strict';

// SPX is a simple profiling extension for PHP
// See https://github.com/NoiseByNorthwest/php-spx
const SPX_MODES = [ 'off', 'enabled' ];

/**
 * Custom parsing for the SPX mode set via yargs. This function ensures three things:
 * 1. If the --spx flag was not set, set it to 'off'.
 * 2. If the --spx flag was set by itself, default to 'enabled'.
 * 3. If the --spx flag includes modes, make sure they are accepted by SPX.
 *
 * @param {string|undefined} value The user-set mode of SPX; undefined if there is no --spx flag.
 * @return {string} The SPX mode to use with defaults applied.
 */
module.exports = function parseSpxMode( value ) {
	if ( value === undefined ) {
		return 'off';
	}
	if ( typeof value !== 'string' ) {
		throwSpxModeError( value );
	}

	if ( value.length === 0 || value === 'undefined' ) {
		return 'enabled';
	}

	if ( ! SPX_MODES.includes( value ) ) {
		throwSpxModeError( value );
	}

	return value;
};

function throwSpxModeError( value ) {
	throw new Error(
		`"${ value }" is not a mode recognized by SPX. Valid modes are: ${ SPX_MODES.join(
			', '
		) }`
	);
}
