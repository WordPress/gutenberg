/**
 * Recursively finds all transferable objects within a value.
 *
 * This function traverses arrays and plain objects to find nested
 * transferable objects like ArrayBuffers, which can then be passed
 * to postMessage for zero-copy transfer.
 *
 * @param value - The value to search for transferables.
 * @return Array of all transferable objects found.
 */
export function findTransferables( value: unknown ): Transferable[] {
	const transferables: Transferable[] = [];
	const seen = new WeakSet< object >();

	function walk( obj: unknown ): void {
		// Handle null/undefined and non-objects.
		if ( obj === null || obj === undefined || typeof obj !== 'object' ) {
			return;
		}

		// Check for ArrayBuffer (most common transferable).
		if ( obj instanceof ArrayBuffer ) {
			if ( ! transferables.includes( obj ) ) {
				transferables.push( obj );
			}
			return;
		}

		// Check for MessagePort.
		if ( obj instanceof MessagePort ) {
			transferables.push( obj );
			return;
		}

		// Check for ImageBitmap (may not exist in all environments).
		if (
			typeof ImageBitmap !== 'undefined' &&
			obj instanceof ImageBitmap
		) {
			transferables.push( obj );
			return;
		}

		// Check for OffscreenCanvas (may not exist in all environments).
		if (
			typeof OffscreenCanvas !== 'undefined' &&
			obj instanceof OffscreenCanvas
		) {
			transferables.push( obj );
			return;
		}

		// Check for ReadableStream (may not exist in all environments).
		if (
			typeof ReadableStream !== 'undefined' &&
			obj instanceof ReadableStream
		) {
			transferables.push( obj );
			return;
		}

		// Check for WritableStream (may not exist in all environments).
		if (
			typeof WritableStream !== 'undefined' &&
			obj instanceof WritableStream
		) {
			transferables.push( obj );
			return;
		}

		// Check for TransformStream (may not exist in all environments).
		if (
			typeof TransformStream !== 'undefined' &&
			obj instanceof TransformStream
		) {
			transferables.push( obj );
			return;
		}

		// Avoid circular references.
		if ( seen.has( obj ) ) {
			return;
		}
		seen.add( obj );

		// Handle TypedArrays - get their underlying buffer.
		if ( ArrayBuffer.isView( obj ) ) {
			const buffer = obj.buffer;
			if (
				buffer instanceof ArrayBuffer &&
				! transferables.includes( buffer )
			) {
				transferables.push( buffer );
			}
			return;
		}

		// Handle arrays.
		if ( Array.isArray( obj ) ) {
			const arr = obj as unknown[];
			for ( let i = 0; i < arr.length; i++ ) {
				walk( arr[ i ] );
			}
			return;
		}

		// Handle plain objects.
		const keys = Object.keys( obj );
		for ( let i = 0; i < keys.length; i++ ) {
			walk( ( obj as Record< string, unknown > )[ keys[ i ] ] );
		}
	}

	walk( value );
	return transferables;
}
