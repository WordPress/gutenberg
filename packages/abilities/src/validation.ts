/**
 * Schema validation for client-side ability input and output schemas using AJV and ajv-formats.
 *
 * This utility provides validation for JSON Schema draft-04.
 * Rules are configured to support the intersection of common rules between JSON Schema draft-04, WordPress (a subset of JSON Schema draft-04),
 * and various providers like OpenAI and Anthropic.
 *
 * @see https://developer.wordpress.org/rest-api/extending-the-rest-api/schema/#json-schema-basics
 */

/**
 * External dependencies
 */
import Ajv from 'ajv-draft-04';
import addFormats from 'ajv-formats';

/**
 * Internal dependencies
 */
import type { ValidationError } from './types';

const ajv = new Ajv( {
	coerceTypes: false, // No type coercion - AI should send proper JSON
	useDefaults: true,
	removeAdditional: false, // Keep additional properties
	allErrors: true,
	verbose: true,
	allowUnionTypes: true, // Allow anyOf without explicit type
} );

addFormats( ajv, [ 'date-time', 'email', 'hostname', 'ipv4', 'ipv6', 'uuid' ] );

/**
 * Formats AJV errors into a simple error message.
 * The Abilities API will wrap this with ability_invalid_input/output to match the server side format.
 *
 * @param ajvError The AJV validation error.
 * @param param    The base parameter name.
 * @return Simple error message string.
 */
function formatAjvError( ajvError: any, param: string ): string {
	// Convert AJV's instancePath format (/0/prop) to an array like format to better match WordPress ([0][prop])
	const instancePath = ajvError.instancePath
		? ajvError.instancePath.replace( /\//g, '][' ).replace( /^\]\[/, '[' ) +
		  ']'
		: '';
	const fullParam = param + instancePath;

	switch ( ajvError.keyword ) {
		case 'type':
			return `${ fullParam } is not of type ${ ajvError.params.type }.`;

		case 'required':
			return `${ ajvError.params.missingProperty } is a required property of ${ fullParam }.`;

		case 'additionalProperties':
			return `${ ajvError.params.additionalProperty } is not a valid property of Object.`;

		case 'enum':
			const enumValues = ajvError.params.allowedValues
				.map( ( v: any ) =>
					typeof v === 'string' ? v : JSON.stringify( v )
				)
				.join( ', ' );
			return ajvError.params.allowedValues.length === 1
				? `${ fullParam } is not ${ enumValues }.`
				: `${ fullParam } is not one of ${ enumValues }.`;

		case 'pattern':
			return `${ fullParam } does not match pattern ${ ajvError.params.pattern }.`;

		case 'format':
			const format = ajvError.params.format;
			const formatMessages: Record< string, string > = {
				email: 'Invalid email address.',
				'date-time': 'Invalid date.',
				uuid: `${ fullParam } is not a valid UUID.`,
				ipv4: `${ fullParam } is not a valid IP address.`,
				ipv6: `${ fullParam } is not a valid IP address.`,
				hostname: `${ fullParam } is not a valid hostname.`,
			};
			return formatMessages[ format ] || `Invalid ${ format }.`;

		case 'minimum':
		case 'exclusiveMinimum':
			return ajvError.keyword === 'exclusiveMinimum'
				? `${ fullParam } must be greater than ${ ajvError.params.limit }`
				: `${ fullParam } must be greater than or equal to ${ ajvError.params.limit }`;

		case 'maximum':
		case 'exclusiveMaximum':
			return ajvError.keyword === 'exclusiveMaximum'
				? `${ fullParam } must be less than ${ ajvError.params.limit }`
				: `${ fullParam } must be less than or equal to ${ ajvError.params.limit }`;

		case 'multipleOf':
			return `${ fullParam } must be a multiple of ${ ajvError.params.multipleOf }.`;

		case 'anyOf':
		case 'oneOf':
			return `${ fullParam } is invalid (failed ${ ajvError.keyword } validation).`;

		case 'minLength':
			return `${ fullParam } must be at least ${
				ajvError.params.limit
			} character${ ajvError.params.limit === 1 ? '' : 's' } long.`;

		case 'maxLength':
			return `${ fullParam } must be at most ${
				ajvError.params.limit
			} character${ ajvError.params.limit === 1 ? '' : 's' } long.`;

		case 'minItems':
			return `${ fullParam } must contain at least ${
				ajvError.params.limit
			} item${ ajvError.params.limit === 1 ? '' : 's' }.`;

		case 'maxItems':
			return `${ fullParam } must contain at most ${
				ajvError.params.limit
			} item${ ajvError.params.limit === 1 ? '' : 's' }.`;

		case 'uniqueItems':
			return `${ fullParam } has duplicate items.`;

		case 'minProperties':
			return `${ fullParam } must contain at least ${
				ajvError.params.limit
			} propert${ ajvError.params.limit === 1 ? 'y' : 'ies' }.`;

		case 'maxProperties':
			return `${ fullParam } must contain at most ${
				ajvError.params.limit
			} propert${ ajvError.params.limit === 1 ? 'y' : 'ies' }.`;

		default:
			// Fallback for any unhandled validation keywords
			return (
				ajvError.message ||
				`${ fullParam } is invalid (failed ${ ajvError.keyword } validation).`
			);
	}
}

/**
 * Validates a value against a JSON Schema.
 *
 * @param value The value to validate.
 * @param args  The JSON Schema to validate against.
 * @param param Optional parameter name for error messages.
 * @return True if valid, error message string if invalid.
 */
export function validateValueFromSchema(
	value: any,
	args: Record< string, any >,
	param = ''
): true | ValidationError {
	// WordPress server expects schema to be an array/object
	if ( ! args || typeof args !== 'object' ) {
		// WordPress issues a _doing_it_wrong for invalid schema
		// Match this behavior with console.warn on client-side
		// eslint-disable-next-line no-console
		console.warn( `Schema must be an object. Received ${ typeof args }.` );
		// Continue validation, treating as valid (matching server behavior)
		return true;
	}

	// Type validation - WordPress REST API requires type to be set
	if ( ! args.type && ! args.anyOf && ! args.oneOf ) {
		// WordPress issues a _doing_it_wrong but continues
		// eslint-disable-next-line no-console
		console.warn(
			`The "type" schema keyword for ${ param || 'value' } is required.`
		);
		return true;
	}

	try {
		const { default: defaultValue, ...schemaWithoutDefault } = args;
		const validate = ajv.compile( schemaWithoutDefault );
		const valid = validate( value === undefined ? defaultValue : value );

		if ( valid ) {
			return true;
		}

		// Return the first error as a simple message string
		// The API will wrap this with ability_invalid_input/output
		if ( validate.errors && validate.errors.length > 0 ) {
			// For anyOf/oneOf, look for the more specific error
			const anyOfError = validate.errors.find(
				( e ) => e.keyword === 'anyOf' || e.keyword === 'oneOf'
			);
			if ( anyOfError ) {
				return formatAjvError( anyOfError, param );
			}
			return formatAjvError( validate.errors[ 0 ], param );
		}

		return `${ param } is invalid.`;
	} catch ( error ) {
		// Handle schema compilation errors
		// eslint-disable-next-line no-console
		console.error( 'Schema compilation error:', error );
		return 'Invalid schema provided for validation.';
	}
}
