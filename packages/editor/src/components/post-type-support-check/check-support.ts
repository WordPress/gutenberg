/**
 * Whether a post type's `supports` declares a support key.
 *
 * Kept free of store imports so the editor store can use it.
 *
 * @param supports Post type supports.
 * @param key      Support key, optionally a sub-property (`editor.notes`).
 * @return Whether the key is supported.
 */
export function checkSupport(
	supports: Record< string, any > = {},
	key: string
): boolean {
	// Check for top-level support keys.
	if ( supports[ key ] !== undefined ) {
		return !! supports[ key ];
	}

	const [ topKey, subKey ] = key.split( '.' );
	// Try to unwrap sub-properties from the superfluous array.
	const [ subProperties ] = Array.isArray( supports[ topKey ] )
		? supports[ topKey ]
		: [];

	return Array.isArray( subProperties )
		? subProperties.includes( subKey )
		: !! subProperties?.[ subKey ];
}
