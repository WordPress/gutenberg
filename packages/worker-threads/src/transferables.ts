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
 * Finds transferable objects in an RPC message.
 *
 * This function only checks direct arguments (for CALL messages) or the
 * result value (for RESULT messages). Transferables should be passed as
 * standalone parameters, not nested within objects.
 *
 * @param message - The RPC message to search for transferables.
 * @return Array of all transferable objects found.
 */
export function findTransferables( message: unknown ): Transferable[] {
	if ( typeof message !== 'object' || message === null ) {
		return [];
	}

	const msg = message as Record< string, unknown >;
	const transferables: Transferable[] = [];
	const seen = new Set< Transferable >();

	function addTransferable( value: unknown ): void {
		const transferable = getTransferable( value );
		if ( transferable && ! seen.has( transferable ) ) {
			seen.add( transferable );
			transferables.push( transferable );
		}
	}

	// Check args array for CALL messages.
	if ( Array.isArray( msg.args ) ) {
		for ( const arg of msg.args ) {
			addTransferable( arg );
		}
	}

	// Check result for RESULT messages.
	if ( 'result' in msg ) {
		addTransferable( msg.result );
	}

	return transferables;
}
