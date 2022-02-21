/**
 * External dependencies
 */
import Ajv from 'ajv';

/**
 * Internal dependencies
 */
import apiFetch from '..';

const ajv = new Ajv( {
	strict: false,
} );

/**
 * The REST API enforces an upper limit on the per_page option. To handle large
 * collections, apiFetch consumers can pass `per_page=-1`; this middleware will
 * then recursively assemble a full response array from all available pages.
 *
 * @type {import('../types').APIFetchMiddleware}
 */
const jsonSchemaMiddleware = async ( options, next ) => {
	if ( options.parse === false ) {
		// If a consumer has opted out of parsing, do not apply middleware.
		return next( options );
	}

	if ( options.method === 'OPTIONS' ) {
		return next( options );
	}

	// Retrieve requested page of results.
	const schemaResponse = await apiFetch( {
		...options,
		method: 'OPTIONS',
	} );

	if ( ! ( 'schema' in schemaResponse ) ) {
		return next( options );
	}

	const { schema } = schemaResponse;
	const response = await next( options );

	delete schema.$schema;
	const validate = ajv.compile( schema );
	const valid = validate( response );
	if ( ! valid ) {
		setTimeout( () => {
			console.log( schema );
			throw validate.errors;
		} );
	}

	return response;
};

export default jsonSchemaMiddleware;
