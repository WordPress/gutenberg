/**
 * Read string-valued labels from a stored config into a fresh object,
 * skipping keys that are absent or non-string. Used by `toFormData` to
 * normalize REST rows into the in-memory form shape.
 * @param source
 * @param keys
 */
export function pickStoredLabels< L extends object >(
	source: L | undefined,
	keys: ReadonlyArray< keyof L >
): L {
	const labels = {} as Record< string, string >;
	for ( const key of keys ) {
		const value = ( source as Record< string, any > | undefined )?.[
			key as string
		];
		if ( typeof value === 'string' ) {
			labels[ key as string ] = value;
		}
	}
	return labels as L;
}

/**
 * Trim labels and drop blanks before saving. `singular_name` is preserved
 * as-is (even if empty) so a server-side validation error points at the
 * right field rather than silently dropping it.
 * @param source
 * @param keys
 */
export function serializeLabels< L extends { singular_name?: string } >(
	source: L,
	keys: ReadonlyArray< keyof L >
): L {
	const labels = {} as Record< string, string | undefined >;
	for ( const key of keys ) {
		const value = ( source as Record< string, any > )[ key as string ];
		if ( typeof value === 'string' && value.trim() !== '' ) {
			labels[ key as string ] = value.trim();
		}
	}
	labels.singular_name = source.singular_name;
	return labels as L;
}
