/**
 * WordPress-specific schema keywords that are not part of JSON Schema
 * and should be stripped before registering abilities on the client.
 */
const WP_SCHEMA_KEYWORDS = new Set( [
	'sanitize_callback',
	'validate_callback',
	'arg_options',
] );

/**
 * JSON Schema keywords whose values are maps of sub-schemas (where the
 * keys are user-defined names, not schema keywords). These need special
 * handling so that user-defined keys are preserved while their values
 * are recursively sanitized.
 */
const SUB_SCHEMA_MAP_KEYS = new Set( [
	'properties',
	'patternProperties',
	'definitions',
	'$defs',
	'dependencies',
] );

/**
 * Recursively removes WordPress-specific keywords from a JSON Schema object.
 *
 * WordPress REST API schemas may include server-side properties like
 * `sanitize_callback` that are not valid JSON Schema keywords. These cause
 * client-side schema validators (AJV) to reject the schema during compilation.
 *
 * @param schema The schema object to sanitize.
 * @return A new schema object with WordPress-specific keywords removed.
 */
export function sanitizeSchema(
	schema: Record< string, any >
): Record< string, any > {
	const sanitized: Record< string, any > = {};

	for ( const [ key, value ] of Object.entries( schema ) ) {
		if ( WP_SCHEMA_KEYWORDS.has( key ) ) {
			continue;
		}

		if ( ! value || typeof value !== 'object' ) {
			sanitized[ key ] = value;
		} else if ( Array.isArray( value ) ) {
			sanitized[ key ] = value.map( ( item ) =>
				item && typeof item === 'object' && ! Array.isArray( item )
					? sanitizeSchema( item )
					: item
			);
		} else if ( SUB_SCHEMA_MAP_KEYS.has( key ) ) {
			sanitized[ key ] = Object.fromEntries(
				Object.entries( value ).map( ( [ k, v ] ) => [
					k,
					v && typeof v === 'object' && ! Array.isArray( v )
						? sanitizeSchema( v )
						: v,
				] )
			);
		} else {
			sanitized[ key ] = sanitizeSchema( value );
		}
	}

	return sanitized;
}
