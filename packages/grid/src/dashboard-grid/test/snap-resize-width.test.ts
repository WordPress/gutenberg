import { describe, expect, it } from 'vitest';
import {
	resolveWidthChoices,
	snapSpanToWidthChoices,
} from '../snap-resize-width';
import type { SpanBounds } from '../../shared/resize-snap';

function bounds( overrides: Partial< SpanBounds > = {} ): SpanBounds {
	return {
		minWidth: 1,
		minHeight: 1,
		maxWidth: 6,
		maxHeight: Infinity,
		...overrides,
	};
}

describe( 'resolveWidthChoices', () => {
	it( 'resolves the declared tokens in order, expanding `full` to the largest span', () => {
		expect( resolveWidthChoices( [ 1, 'full', 3 ], bounds(), 6 ) ).toEqual(
			[
				{ token: 1, span: 1 },
				{ token: 'full', span: 6 },
				{ token: 3, span: 3 },
			]
		);
	} );

	it( 'clamps numeric tokens to the item span bounds', () => {
		expect(
			resolveWidthChoices(
				[ 1, 3, 8, 'full' ],
				bounds( { minWidth: 2, maxWidth: 4 } ),
				6
			)
		).toEqual( [
			{ token: 1, span: 2 },
			{ token: 3, span: 3 },
			{ token: 8, span: 4 },
			{ token: 'full', span: 4 },
		] );
	} );

	it( 'falls back to the column count when the item declares no bounds', () => {
		expect( resolveWidthChoices( [ 2, 'full' ], undefined, 8 ) ).toEqual( [
			{ token: 2, span: 2 },
			{ token: 'full', span: 8 },
		] );
	} );

	it( 'keeps choices that resolve to the same span as distinct candidates', () => {
		// A one-column container narrows `1` and `full` to the same span;
		// the menu must still be able to tell them apart.
		expect( resolveWidthChoices( [ 1, 'full' ], undefined, 1 ) ).toEqual( [
			{ token: 1, span: 1 },
			{ token: 'full', span: 1 },
		] );
	} );
} );

describe( 'snapSpanToWidthChoices', () => {
	const choices = resolveWidthChoices( [ 1, 'full' ], bounds(), 6 );

	it( 'preserves the gesture-start token when the horizontal span is unchanged', () => {
		expect(
			snapSpanToWidthChoices( {
				impliedSpan: 1,
				startSpan: 1,
				startToken: 1,
				choices,
				bounds: bounds(),
				effectiveColumns: 6,
			} )
		).toEqual( { span: 1, token: 1 } );
	} );

	it( 'preserves a named gesture-start token when the span is unchanged', () => {
		expect(
			snapSpanToWidthChoices( {
				impliedSpan: 1,
				startSpan: 1,
				startToken: 'full',
				choices: resolveWidthChoices( [ 1, 'full' ], bounds(), 1 ),
				bounds: bounds(),
				effectiveColumns: 1,
			} )
		).toEqual( { span: 1, token: 'full' } );
	} );

	it( 'moves to the nearest choice when the pointer changes the span', () => {
		expect(
			snapSpanToWidthChoices( {
				impliedSpan: 5,
				startSpan: 1,
				startToken: 1,
				choices,
				bounds: bounds(),
				effectiveColumns: 6,
			} )
		).toEqual( { span: 6, token: 'full' } );
	} );

	it( 'clamps the pointer-implied span before matching', () => {
		const limited = bounds( { maxWidth: 4 } );
		expect(
			snapSpanToWidthChoices( {
				impliedSpan: 99,
				startSpan: 1,
				startToken: 1,
				choices: resolveWidthChoices( [ 1, 'full' ], limited, 6 ),
				bounds: limited,
				effectiveColumns: 6,
			} )
		).toEqual( { span: 4, token: 'full' } );
	} );

	it( 'prefers the declared order when choices resolve to the same span', () => {
		const tied = resolveWidthChoices( [ 2, 'full' ], undefined, 2 );
		expect(
			snapSpanToWidthChoices( {
				impliedSpan: 2,
				startSpan: 1,
				startToken: 1,
				choices: tied,
				bounds: bounds(),
				effectiveColumns: 2,
			} )
		).toEqual( { span: 2, token: 2 } );

		expect(
			snapSpanToWidthChoices( {
				impliedSpan: 2,
				startSpan: 1,
				startToken: 1,
				choices: resolveWidthChoices( [ 'full', 2 ], undefined, 2 ),
				bounds: bounds(),
				effectiveColumns: 2,
			} )
		).toEqual( { span: 2, token: 'full' } );
	} );

	it( 'keeps a stored token outside the choices while the span is unchanged', () => {
		expect(
			snapSpanToWidthChoices( {
				impliedSpan: 3,
				startSpan: 3,
				startToken: 'fill',
				choices,
				bounds: bounds(),
				effectiveColumns: 6,
			} )
		).toEqual( { span: 3, token: 'fill' } );

		expect(
			snapSpanToWidthChoices( {
				impliedSpan: 1,
				startSpan: 1,
				startToken: undefined,
				choices,
				bounds: bounds(),
				effectiveColumns: 6,
			} )
		).toEqual( { span: 1, token: undefined } );
	} );

	it( 'moves a stored token outside the choices once the span changes', () => {
		expect(
			snapSpanToWidthChoices( {
				impliedSpan: 2,
				startSpan: 3,
				startToken: 'fill',
				choices: resolveWidthChoices( [ 2, 'full' ], bounds(), 6 ),
				bounds: bounds(),
				effectiveColumns: 6,
			} )
		).toEqual( { span: 2, token: 2 } );
	} );

	it( 'returns the clamped span and start token when there are no choices', () => {
		expect(
			snapSpanToWidthChoices( {
				impliedSpan: 10,
				startSpan: 1,
				startToken: 1,
				choices: [],
				bounds: bounds( { maxWidth: 4 } ),
				effectiveColumns: 6,
			} )
		).toEqual( { span: 4, token: 1 } );
	} );
} );
