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
	if ( ! schema || typeof schema !== 'object' || Array.isArray( schema ) ) {
		return schema;
	}

	const sanitized: Record< string, any > = {};

	for ( const key of Object.keys( schema ) ) {
		if ( WP_SCHEMA_KEYWORDS.has( key ) ) {
			continue;
		}

		const value = schema[ key ];

		if (
			( key === 'properties' ||
				key === 'patternProperties' ||
				key === 'definitions' ||
				key === '$defs' ) &&
			value &&
			typeof value === 'object' &&
			! Array.isArray( value )
		) {
			sanitized[ key ] = Object.fromEntries(
				Object.entries( value ).map( ( [ k, v ] ) => [
					k,
					sanitizeSchema( v as Record< string, any > ),
				] )
			);
		} else if ( key === 'items' && value && typeof value === 'object' ) {
			if ( Array.isArray( value ) ) {
				sanitized[ key ] = value.map( ( item: Record< string, any > ) =>
					sanitizeSchema( item )
				);
			} else {
				sanitized[ key ] = sanitizeSchema( value );
			}
		} else if (
			( key === 'additionalProperties' || key === 'additionalItems' ) &&
			value &&
			typeof value === 'object'
		) {
			sanitized[ key ] = sanitizeSchema( value );
		} else if (
			( key === 'anyOf' || key === 'oneOf' || key === 'allOf' ) &&
			Array.isArray( value )
		) {
			sanitized[ key ] = value.map( ( item: Record< string, any > ) =>
				sanitizeSchema( item )
			);
		} else if ( key === 'not' && value && typeof value === 'object' ) {
			sanitized[ key ] = sanitizeSchema( value );
		} else if (
			key === 'dependencies' &&
			value &&
			typeof value === 'object' &&
			! Array.isArray( value )
		) {
			sanitized[ key ] = Object.fromEntries(
				Object.entries( value ).map( ( [ k, v ] ) => [
					k,
					v && typeof v === 'object' && ! Array.isArray( v )
						? sanitizeSchema( v as Record< string, any > )
						: v,
				] )
			);
		} else {
			sanitized[ key ] = value;
		}
	}

	return sanitized;
}
