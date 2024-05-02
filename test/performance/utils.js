/**
 * External dependencies
 */
import { existsSync, readFileSync, unlinkSync } from 'fs';

export function sum( array ) {
	if ( ! array || ! array.length ) {
		return undefined;
	}

	return array.reduce( ( a, b ) => a + b, 0 );
}

export function average( array ) {
	if ( ! array || ! array.length ) {
		return undefined;
	}

	return sum( array ) / array.length;
}

export function median( array ) {
	if ( ! array || ! array.length ) {
		return undefined;
	}

	const numbers = [ ...array ].sort( ( a, b ) => a - b );
	const middleIndex = Math.floor( numbers.length / 2 );

	if ( numbers.length % 2 === 0 ) {
		return ( numbers[ middleIndex - 1 ] + numbers[ middleIndex ] ) / 2;
	}
	return numbers[ middleIndex ];
}

export function minimum( array ) {
	if ( ! array || ! array.length ) {
		return undefined;
	}

	return Math.min( ...array );
}

export function maximum( array ) {
	if ( ! array || ! array.length ) {
		return undefined;
	}

	return Math.max( ...array );
}

export function round( number, decimalPlaces = 2 ) {
	const factor = Math.pow( 10, decimalPlaces );

	return Math.round( number * factor ) / factor;
}

export function readFile( filePath ) {
	if ( ! existsSync( filePath ) ) {
		throw new Error( `File does not exist: ${ filePath }` );
	}

	return readFileSync( filePath, 'utf8' ).trim();
}

export function deleteFile( filePath ) {
	if ( existsSync( filePath ) ) {
		unlinkSync( filePath );
	}
}
