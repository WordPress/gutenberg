import { afterEach, describe, expect, it } from 'vitest';
import { getScreenTransform, toLocalDelta } from '../utils';

function createNested( outerStyle: string, innerStyle = '' ) {
	const outer = document.createElement( 'div' );
	const inner = document.createElement( 'div' );
	outer.setAttribute( 'style', outerStyle );
	inner.setAttribute( 'style', innerStyle );
	outer.appendChild( inner );
	document.body.appendChild( outer );
	return inner;
}

function round( matrix: Record< string, number > ) {
	return Object.fromEntries(
		Object.entries( matrix ).map( ( [ key, value ] ) => [
			key,
			Math.round( value * 1000 ) / 1000 + 0,
		] )
	);
}

describe( 'getScreenTransform', () => {
	afterEach( () => {
		document.body.innerHTML = '';
	} );

	it( 'returns the identity for an untransformed element', () => {
		expect( round( getScreenTransform( createNested( '' ) ) ) ).toEqual( {
			a: 1,
			b: 0,
			c: 0,
			d: 1,
		} );
	} );

	it( 'reads the rotate property', () => {
		expect(
			round( getScreenTransform( createNested( 'rotate: 90deg' ) ) )
		).toEqual( { a: 0, b: 1, c: -1, d: 0 } );
	} );

	it( 'reads the scale property', () => {
		expect(
			round( getScreenTransform( createNested( 'scale: 2 3' ) ) )
		).toEqual( { a: 2, b: 0, c: 0, d: 3 } );
	} );

	it( 'ignores translation', () => {
		expect(
			round(
				getScreenTransform(
					createNested(
						'translate: 40px 10px; transform: translateX(20px)'
					)
				)
			)
		).toEqual( { a: 1, b: 0, c: 0, d: 1 } );
	} );

	it( 'combines the element with its ancestors', () => {
		expect(
			round(
				getScreenTransform(
					createNested( 'rotate: 45deg', 'rotate: 45deg; scale: 2' )
				)
			)
		).toEqual( { a: 0, b: 2, c: -2, d: 0 } );
	} );

	it( 'ignores a rotation that tilts the element out of the page', () => {
		expect(
			round( getScreenTransform( createNested( 'rotate: x 30deg' ) ) )
		).toEqual( { a: 1, b: 0, c: 0, d: 1 } );
	} );
} );

describe( 'toLocalDelta', () => {
	it( 'maps a downward drag onto the x axis of a quarter turn', () => {
		const local = toLocalDelta( { a: 0, b: 1, c: -1, d: 0 }, 0, 10 );
		expect( local.x ).toBeCloseTo( 10 );
		expect( local.y ).toBeCloseTo( 0 );
	} );

	it( 'divides the drag by the scale', () => {
		expect( toLocalDelta( { a: 2, b: 0, c: 0, d: 4 }, 10, 10 ) ).toEqual( {
			x: 5,
			y: 2.5,
		} );
	} );

	it( 'leaves the drag as is for a flattened element', () => {
		expect( toLocalDelta( { a: 0, b: 0, c: 0, d: 0 }, 3, 4 ) ).toEqual( {
			x: 3,
			y: 4,
		} );
	} );
} );
