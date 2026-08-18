/**
 * Computes the accept attribute for file inputs based on allowed types
 * and server-supported MIME types.
 *
 * This ensures users can only select file types that the server can handle,
 * preventing upload failures (e.g., HEIC files when server lacks support).
 *
 * @param {Array}  allowedTypes     - List of allowed media types (e.g., ['image', 'video']).
 * @param {Object} allowedMimeTypes - Map of allowed MIME types from server settings.
 * @param {string} accept           - Optional explicit accept attribute to use.
 *
 * @return {string|undefined} Computed accept attribute value, or undefined if no restrictions apply.
 */
export function getComputedAcceptAttribute(
	allowedTypes,
	allowedMimeTypes,
	accept
) {
	// If accept prop is explicitly provided, use it as is.
	if ( accept ) {
		return accept;
	}

	// If allowedMimeTypes is not available, fall back to wildcard.
	if (
		! allowedMimeTypes ||
		typeof allowedMimeTypes !== 'object' ||
		Object.keys( allowedMimeTypes ).length === 0
	) {
		if ( allowedTypes && allowedTypes.length > 0 ) {
			return allowedTypes.map( ( type ) => `${ type }/*` ).join( ',' );
		}
		return undefined;
	}

	// If no allowedTypes specified, we can't filter, so return undefined.
	if ( ! allowedTypes || allowedTypes.length === 0 ) {
		return undefined;
	}

	// Build a list of specific MIME types based on allowedTypes.
	const acceptedMimeTypes = [];

	for ( const [ , mimeType ] of Object.entries( allowedMimeTypes ) ) {
		// Check if this MIME type matches any of the allowedTypes.
		const isAllowed = allowedTypes.some( ( allowedType ) => {
			// Support both 'image' and 'image/jpeg' formats.
			if ( allowedType.includes( '/' ) ) {
				return mimeType === allowedType;
			}
			return mimeType.startsWith( `${ allowedType }/` );
		} );

		if ( isAllowed ) {
			acceptedMimeTypes.push( mimeType );
		}
	}

	// If we found specific MIME types, use them. Otherwise fall back to wildcard.
	if ( acceptedMimeTypes.length > 0 ) {
		return acceptedMimeTypes.join( ',' );
	}

	return allowedTypes.map( ( type ) => `${ type }/*` ).join( ',' );
}

/**
 * Decides whether a block drag may be dropped on a media placeholder.
 *
 * Block names are accepted either fully qualified (`core/image`, as reported
 * by the block editor store for canvas drags) or bare (`image`, as advertised
 * in the `dataTransfer` type names of inserter drags).
 *
 * @param {Object}   options
 * @param {string[]} options.blockNames   Names of the blocks being dragged.
 * @param {string[]} options.allowedTypes Media types the placeholder accepts.
 * @param {boolean}  options.multiple     Whether more than one item is
 *                                        accepted.
 *
 * @return {boolean} Whether the drag is eligible.
 */
export function isMediaDragEligible( { blockNames, allowedTypes, multiple } ) {
	// An unidentified drag is never eligible. Without this, `every` below
	// would vacuously accept a drag whose contents are unknown.
	if ( ! blockNames?.length || ! allowedTypes?.length ) {
		return false;
	}

	if ( ! multiple && blockNames.length > 1 ) {
		return false;
	}

	return blockNames.every( ( name ) =>
		allowedTypes.includes( name.split( '/' ).pop() )
	);
}
