/**
 * Checks if a value is a transferable object.
 *
 * @param value - The value to check.
 * @return The transferable object, or null if not transferable.
 */
function getTransferable( value: unknown ): Transferable | null {
	if ( value === null || value === undefined || typeof value !== 'object' ) {
		return null;
	}

	// ArrayBuffer is the most common transferable.
	if ( value instanceof ArrayBuffer ) {
		return value;
	}

	// TypedArrays - get their underlying buffer.
	if ( ArrayBuffer.isView( value ) ) {
		const buffer = value.buffer;
		if ( buffer instanceof ArrayBuffer ) {
			return buffer;
		}
	}

	return null;
}

/**
 * Finds transferable objects in an array of values.
 *
 * This function checks direct values in the array. Transferables should be
 * passed as standalone parameters, not nested within objects.
 *
 * @param values - The array of values to search for transferables.
 * @return Array of all transferable objects found.
 */
export function findTransferables( values: unknown ): Transferable[] {
	if ( ! Array.isArray( values ) ) {
		return [];
	}

	const transferables: Transferable[] = [];
	const seen = new Set< Transferable >();

	for ( const value of values ) {
		const transferable = getTransferable( value );
		if ( transferable && ! seen.has( transferable ) ) {
			seen.add( transferable );
			transferables.push( transferable );
		}
	}

	return transferables;
}
