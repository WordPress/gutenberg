'use strict';

/**
 * @typedef {import('./parse-source-string').WPSource} WPSource
 */

/**
 * Error subtype which indicates that an expected validation erorr occurred
 * while reading wp-env configuration.
 */
class ValidationError extends Error {}

/**
 * Validates that the value is a string.
 *
 * @param {string} configFile The configuration file we're validating.
 * @param {string} configKey  The configuration key we're validating.
 * @param {number} value      The value to check.
 */
function checkString( configFile, configKey, value ) {
	if ( typeof value !== 'string' ) {
		throw new ValidationError(
			`Invalid ${ configFile }: "${ configKey }" must be a string.`
		);
	}
}

/**
 * Validates the port and throws if it isn't valid.
 *
 * @param {string} configFile The configuration file we're validating.
 * @param {string} configKey  The configuration key we're validating.
 * @param {number} port       The port to check.
 */
function checkPort( configFile, configKey, port ) {
	if ( ! Number.isInteger( port ) ) {
		throw new ValidationError(
			`Invalid ${ configFile }: "${ configKey }" must be an integer.`
		);
	}

	if ( port < 0 || port > 65535 ) {
		throw new ValidationError(
			`Invalid ${ configFile }: "${ configKey }" must be a valid port.`
		);
	}
}

/**
 * Validates the array and throws if it isn't valid.
 *
 * @param {string}   configFile The config file we're validating.
 * @param {string}   configKey  The configuration key we're validating.
 * @param {string[]} array      The array that we're checking.
 */
function checkStringArray( configFile, configKey, array ) {
	if ( ! Array.isArray( array ) ) {
		throw new ValidationError(
			`Invalid ${ configFile }: "${ configKey }" must be an array.`
		);
	}

	if ( array.some( ( value ) => typeof value !== 'string' ) ) {
		throw new ValidationError(
			`Invalid ${ configFile }: "${ configKey }" must be an array of strings.`
		);
	}
}

/**
 * Validates the object and throws if it isn't valid.
 *
 * @param {string}   configFile The config file we're validating.
 * @param {string}   configKey  The configuration key we're validating.
 * @param {string[]} obj        The object that we're checking.
 * @param {string[]} allowTypes The types that are allowed.
 * @param {boolean}  allowEmpty Indicates whether or not empty values are allowed.
 */
function checkObjectWithValues(
	configFile,
	configKey,
	obj,
	allowTypes,
	allowEmpty
) {
	if ( allowTypes === undefined ) {
		allowTypes = [];
	}

	if ( typeof obj !== 'object' || Array.isArray( obj ) ) {
		throw new ValidationError(
			`Invalid ${ configFile }: "${ configKey }" must be an object.`
		);
	}

	for ( const key in obj ) {
		// Some values need to be uniquely validated.
		switch ( obj[ key ] ) {
			case null:
			case undefined: {
				break;
			}

			default: {
				if ( ! obj[ key ] && ! allowEmpty ) {
					throw new ValidationError(
						`Invalid ${ configFile }: "${ configKey }.${ key }" must not be empty.`
					);
				}
			}
		}

		// Some types need to be uniquely identified.
		let type;
		if ( obj[ key ] === undefined ) {
			type = 'undefined';
		} else if ( obj[ key ] === null ) {
			type = 'null';
		} else if ( Array.isArray( obj[ key ] ) ) {
			type = 'array';
		} else {
			type = typeof obj[ key ];
		}

		if ( ! allowTypes.includes( type ) ) {
			throw new ValidationError(
				`Invalid ${ configFile }: "${ configKey }.${ key }" must be of type: ${ allowTypes.join(
					' or '
				) }.`
			);
		}
	}
}

/**
 * Validates the version and throws if it isn't valid.
 *
 * @param {string} configFile The config file we're validating.
 * @param {string} configKey  The configuration key we're validating.
 * @param {string} version    The version that we're checking.
 */
function checkVersion( configFile, configKey, version ) {
	if ( typeof version !== 'string' ) {
		throw new ValidationError(
			`Invalid ${ configFile }: "${ configKey }" must be a string.`
		);
	}

	if ( ! version.match( /[0-9]+(?:\.[0-9]+)*/ ) ) {
		throw new ValidationError(
			`Invalid ${ configFile }: "${ configKey }" must be a string of the format "X", "X.X", or "X.X.X".`
		);
	}
}

/**
 * Validates the url and throws if it isn't valid.
 *
 * @param {string} configFile The config file we're validating.
 * @param {string} configKey  The configuration key we're validating.
 * @param {string} url        The URL that we're checking.
 */
function checkValidURL( configFile, configKey, url ) {
	try {
		new URL( url );
	} catch {
		throw new ValidationError(
			`Invalid ${ configFile }: "${ configKey }" must be a valid URL.`
		);
	}
}

module.exports = {
	ValidationError,
	checkString,
	checkPort,
	checkStringArray,
	checkObjectWithValues,
	checkVersion,
	checkValidURL,
};
