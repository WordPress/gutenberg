import { colord } from 'colord';
import { useState } from '@wordpress/element';
import type { ControlPoint, CustomGradientBarProps } from '../types';

type ControlPointKeyState = {
	points: ControlPoint[];
	keys: number[];
	nextKey: number;
	pending?: { points: ControlPoint[]; keys: number[] };
};

function copyPoints( points: ControlPoint[] ): ControlPoint[] {
	return points.map( ( { color, position } ) => ( { color, position } ) );
}

function getControlPointKeyState(
	points: ControlPoint[],
	previous?: ControlPointKeyState
): ControlPointKeyState {
	if ( ! previous ) {
		return {
			points: copyPoints( points ),
			keys: points.map( ( _, index ) => index ),
			nextKey: points.length,
		};
	}

	const hasSameColor = ( first: ControlPoint, second: ControlPoint ) => {
		if ( first.color === second.color ) {
			return true;
		}
		const firstColor = colord( first.color );
		const secondColor = colord( second.color );
		return (
			firstColor.isValid() &&
			secondColor.isValid() &&
			firstColor.toRgbString() === secondColor.toRgbString()
		);
	};
	const hasSameValues = ( first: ControlPoint, second: ControlPoint ) =>
		Object.is( first.position, second.position ) &&
		hasSameColor( first, second );
	const hasSameRawValues = ( first: ControlPoint, second: ControlPoint ) =>
		Object.is( first.position, second.position ) &&
		first.color === second.color;

	const pending = previous.pending;
	if (
		pending &&
		points.length === pending.points.length &&
		points.every( ( point, index ) =>
			hasSameRawValues( point, pending.points[ index ] )
		)
	) {
		return {
			points: pending.points,
			keys: pending.keys,
			nextKey: previous.nextKey,
		};
	}

	if (
		points.length === previous.points.length &&
		points.every( ( point, index ) =>
			hasSameRawValues( point, previous.points[ index ] )
		)
	) {
		return previous;
	}

	const keys: Array< number | undefined > = Array( points.length ).fill(
		undefined
	);
	const used = new Set< number >();
	const assign = ( nextIndex: number, oldIndex: number ) => {
		keys[ nextIndex ] = previous.keys[ oldIndex ];
		used.add( oldIndex );
	};

	// Keep exact CSS values distinct before comparing serialized color aliases.
	if ( points.length === previous.points.length ) {
		points.forEach( ( point, index ) => {
			if ( hasSameRawValues( point, previous.points[ index ] ) ) {
				assign( index, index );
			}
		} );
	}
	points.forEach( ( point, index ) => {
		if ( keys[ index ] !== undefined ) {
			return;
		}
		const match = previous.points.findIndex(
			( oldPoint, oldIndex ) =>
				! used.has( oldIndex ) && hasSameRawValues( point, oldPoint )
		);
		if ( match !== -1 ) {
			assign( index, match );
		}
	} );

	const matchUnique = (
		matches: ( first: ControlPoint, second: ControlPoint ) => boolean
	) => {
		points.forEach( ( point, index ) => {
			if ( keys[ index ] !== undefined ) {
				return;
			}
			if (
				points.filter(
					( candidate, nextIndex ) =>
						keys[ nextIndex ] === undefined &&
						matches( candidate, point )
				).length !== 1
			) {
				return;
			}
			const candidates = previous.points
				.map( ( oldPoint, oldIndex ) =>
					! used.has( oldIndex ) && matches( point, oldPoint )
						? oldIndex
						: -1
				)
				.filter( ( oldIndex ) => oldIndex !== -1 );
			if ( candidates.length === 1 ) {
				assign( index, candidates[ 0 ] );
			}
		} );
	};
	// Reuse a partially changed stop only when the remaining match is unique.
	matchUnique( hasSameValues );
	matchUnique( ( first, second ) =>
		Object.is( first.position, second.position )
	);
	matchUnique( hasSameColor );

	let nextKey = previous.nextKey;
	return {
		points: copyPoints( points ),
		keys: keys.map( ( key ) => key ?? nextKey++ ),
		nextKey,
	};
}

export default function useControlPointKeys(
	points: ControlPoint[],
	onChange: ( points: ControlPoint[] ) => void,
	normalizeControlPoints?: CustomGradientBarProps[ 'normalizeControlPoints' ]
) {
	const [ keyState, setKeyState ] = useState( () =>
		getControlPointKeyState( points )
	);
	const nextKeyState = getControlPointKeyState( points, keyState );
	if ( nextKeyState !== keyState ) {
		setKeyState( nextKeyState );
	}
	const pointKeys = nextKeyState.keys;

	const handleChange = ( nextPoints: ControlPoint[] ) => {
		const used = new Set< number >();
		const sourceKeys = nextPoints.map( ( point ) => {
			const index = points.indexOf( point );
			if ( index === -1 || used.has( pointKeys[ index ] ) ) {
				return undefined;
			}
			used.add( pointKeys[ index ] );
			return pointKeys[ index ];
		} );
		const unusedKeys = pointKeys.filter( ( key ) => ! used.has( key ) );
		const missingIndices = sourceKeys.flatMap( ( key, index ) =>
			key === undefined ? [ index ] : []
		);
		// An owned edit replaces one point; insertions and removals retain references.
		if (
			nextPoints.length === points.length &&
			unusedKeys.length === 1 &&
			missingIndices.length === 1
		) {
			sourceKeys[ missingIndices[ 0 ] ] = unusedKeys[ 0 ];
		}
		// Capture both values and identities before a parent can change them.
		const normalized =
			normalizeControlPoints?.( nextPoints ) ??
			nextPoints.map( ( point, sourceIndex ) => ( {
				point,
				sourceIndex,
			} ) );
		const emittedPoints = copyPoints(
			normalized.map( ( { point } ) => point )
		);
		const emittedKeys = normalized.map(
			( { sourceIndex } ) => sourceKeys[ sourceIndex ]
		);
		setKeyState( ( previous ) => {
			let nextKey = previous.nextKey;
			const keys = emittedKeys.map( ( key ) => key ?? nextKey++ );
			return {
				...previous,
				nextKey,
				pending: { points: emittedPoints, keys },
			};
		} );
		onChange( nextPoints );
	};

	return { keys: pointKeys, onChange: handleChange };
}
