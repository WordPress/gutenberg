/**
 * WordPress dependencies
 */
import { useState, useEffect, useRef } from '@wordpress/element';
/**
 * External dependencies
 */
import { isUndefined } from 'lodash';

export const DIRECTION = {
	UP: 'up',
	DOWN: 'down',
	LEFT: 'left',
	RIGHT: 'right',
};

export const BASE_ALIGNMENTS = [
	[ 'top', 'left' ],
	[ 'top', 'center' ],
	[ 'top', 'right' ],
	[ 'center', 'left' ],
	[ 'center' ],
	[ 'center', 'right' ],
	[ 'bottom', 'left' ],
	[ 'bottom', 'center' ],
	[ 'bottom', 'right' ],
];

export const ALIGNMENTS = BASE_ALIGNMENTS.map( normalizeAlignments );
export const ALIGNMENT_VALUES = ALIGNMENTS.map( ( a ) => a.join( ' ' ) );
export const ALIGNMENT_MATRIX = [
	[ 0, 1, 2 ],
	[ 3, 4, 5 ],
	[ 6, 7, 8 ],
];

export function useControlledState( initialState ) {
	const [ state, setState ] = useState( initialState );
	const stateRef = useRef( initialState );

	useEffect( () => {
		if ( initialState !== stateRef.current ) {
			setState( initialState );
			stateRef.current = initialState;
		}
	}, [ initialState ] );

	return [ state, setState ];
}

function normalizeAlignments( alignments = [] ) {
	const a =
		typeof alignments === 'string'
			? alignments.split( /\ |-/g )
			: alignments;
	return a.sort();
}

export function alignmentMatches( align = 'center' ) {
	const a = normalizeAlignments( align );
	return ( nextAlignment ) => {
		return JSON.stringify( nextAlignment ) === JSON.stringify( a );
	};
}

export function getAlignFromIndex( index = 0 ) {
	const align = ALIGNMENTS[ index ];
	return align.join( ' ' );
}

export function getIndexFromAlign( align = 'center' ) {
	const item = ALIGNMENTS.find( alignmentMatches( align ) );
	const index = ALIGNMENTS.indexOf( item );
	const fallbackIndex = 4; //center

	return index > -1 ? index : fallbackIndex;
}

export function getCoordsFromIndex( index = 0 ) {
	const coords = [ 0, 0 ];

	ALIGNMENT_MATRIX.forEach( ( x1, x ) => {
		x1.forEach( ( v, y ) => {
			if ( v === index ) {
				coords[ 0 ] = x;
				coords[ 1 ] = y;
			}
		} );
	} );

	return coords;
}

export function getValueFromCoords( coords, fallback = 0 ) {
	const [ x, y ] = coords;
	const exists =
		! isUndefined( ALIGNMENT_MATRIX[ x ] ) &&
		! isUndefined( ALIGNMENT_MATRIX[ x ][ y ] );
	return exists ? ALIGNMENT_MATRIX[ x ][ y ] : fallback;
}

export function getNextIndexFromDirection( currentIndex, direction ) {
	if ( ! direction ) return currentIndex;
	let nextIndex = currentIndex;
	const [ x, y ] = getCoordsFromIndex( currentIndex );

	switch ( direction ) {
		case DIRECTION.UP:
			nextIndex = getValueFromCoords( [ x - 1, y ], currentIndex );
			break;
		case DIRECTION.DOWN:
			nextIndex = getValueFromCoords( [ x + 1, y ], currentIndex );
			break;
		case DIRECTION.LEFT:
			nextIndex = getValueFromCoords( [ x, y - 1 ], currentIndex );
			break;
		case DIRECTION.RIGHT:
			nextIndex = getValueFromCoords( [ x, y + 1 ], currentIndex );
			break;
		default:
			break;
	}

	return nextIndex;
}
