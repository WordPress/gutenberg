/**
 * Whether a value is a plain object suitable for recursive finalize merges.
 *
 * @param value Candidate value.
 */
function isPlainObject( value: unknown ): value is Record< string, unknown > {
	return typeof value === 'object' && value !== null && ! Array.isArray( value );
}

/**
 * Deep-merges plain objects in a finalize payload.
 *
 * Arrays and non-objects replace the previous value. Nested plain objects
 * are merged recursively so successive `mergeFinalizeData` calls for the
 * same top-level key (e.g. `encode_quality` per size) accumulate.
 *
 * @param existing Current finalize payload.
 * @param incoming Data to merge in.
 * @return Merged payload.
 */
export function mergeFinalizeDataRecords(
	existing: Record< string, unknown >,
	incoming: Record< string, unknown >
): Record< string, unknown > {
	const result: Record< string, unknown > = { ...existing };

	for ( const [ key, value ] of Object.entries( incoming ) ) {
		const previous = result[ key ];
		if ( isPlainObject( value ) && isPlainObject( previous ) ) {
			result[ key ] = mergeFinalizeDataRecords( previous, value );
		} else {
			result[ key ] = value;
		}
	}

	return result;
}
