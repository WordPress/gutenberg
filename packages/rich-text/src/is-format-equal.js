/**
 * Optimised equality check for format objects.
 *
 * @param {?Object} format1 Format to compare.
 * @param {?Object} format2 Format to compare.
 *
 * @return {boolean} True if formats are equal, false if not.
 */
export function isFormatEqual( format1, format2 ) {
	// Both not defined.
	if ( format1 === format2 ) {
		return true;
	}

	// Either not defined.
	if ( ! format1 || ! format2 ) {
		return false;
	}

	if ( format1.type !== format2.type ) {
		return false;
	}

	const attributes1 = format1.attributes;
	const attributes2 = format2.attributes;

	// Both not defined.
	if ( attributes1 === attributes2 ) {
		return true;
	}

	// Either not defined.
	if ( ! attributes1 || ! attributes2 ) {
		return false;
	}

	const keys1 = Object.keys( attributes1 );
	const keys2 = Object.keys( attributes2 );

	if ( keys1.length !== keys2.length ) {
		return false;
	}

	for ( const name of keys1 ) {
		if ( attributes1[ name ] !== attributes2[ name ] ) {
			return false;
		}
	}

	return true;
}
