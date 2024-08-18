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

export function variance( array ) {
	if ( ! array || ! array.length ) {
		return undefined;
	}

	return Math.sqrt(
		sum( array.map( ( x ) => x ** 2 ) ) / array.length -
			( sum( array ) / array.length ) ** 2
	);
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

export function quartiles( array ) {
	const numbers = array.slice().sort( ( a, b ) => a - b );

	function med( offset, length ) {
		if ( length % 2 === 0 ) {
			// even length, average of two middle numbers
			return (
				( numbers[ offset + length / 2 - 1 ] +
					numbers[ offset + length / 2 ] ) /
				2
			);
		}

		// odd length, exact middle point
		return numbers[ offset + ( length - 1 ) / 2 ];
	}

	const q50 = med( 0, numbers.length );

	let q25, q75;
	if ( numbers.length % 2 === 0 ) {
		// medians of two exact halves
		const mid = numbers.length / 2;
		q25 = med( 0, mid );
		q75 = med( mid, mid );
	} else {
		// quartiles are average of medians of the smaller and bigger slice
		const midl = ( numbers.length - 1 ) / 2;
		const midh = ( numbers.length + 1 ) / 2;
		q25 = ( med( 0, midl ) + med( 0, midh ) ) / 2;
		q75 = ( med( midl, midh ) + med( midh, midl ) ) / 2;
	}
	return { q25, q50, q75 };
}

export function stats( values ) {
	if ( ! values || values.length === 0 ) {
		return undefined;
	}
	const { q25, q50, q75 } = quartiles( values );
	const cnt = values.length;
	return {
		q25: round( q25 ),
		q50: round( q50 ),
		q75: round( q75 ),
		cnt,
	};
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
