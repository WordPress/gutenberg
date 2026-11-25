import { afterEach, describe, expect, it } from 'vitest';
import {
	getStyleLinearTransform,
	getViewportLinearTransform,
} from '../transforms';

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

describe( 'getViewportLinearTransform', () => {
	afterEach( () => {
		document.body.innerHTML = '';
	} );

	it( 'returns the identity for an untransformed element', () => {
		expect(
			round( getViewportLinearTransform( createNested( '' ) ) )
		).toEqual( {
			a: 1,
			b: 0,
			c: 0,
			d: 1,
		} );
	} );

	it( 'reads the rotate property', () => {
		expect(
			round(
				getViewportLinearTransform( createNested( 'rotate: 90deg' ) )
			)
		).toEqual( { a: 0, b: 1, c: -1, d: 0 } );
	} );

	it( 'reads the scale property', () => {
		expect(
			round( getViewportLinearTransform( createNested( 'scale: 2 3' ) ) )
		).toEqual( { a: 2, b: 0, c: 0, d: 3 } );
	} );

	it( 'ignores translation', () => {
		expect(
			round(
				getViewportLinearTransform(
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
				getViewportLinearTransform(
					createNested( 'rotate: 45deg', 'rotate: 45deg; scale: 2' )
				)
			)
		).toEqual( { a: 0, b: 2, c: -2, d: 0 } );
	} );

	it( 'ignores a rotation that tilts the element out of the page', () => {
		expect(
			round(
				getViewportLinearTransform( createNested( 'rotate: x 30deg' ) )
			)
		).toEqual( { a: 1, b: 0, c: 0, d: 1 } );
	} );
} );

describe( 'getStyleLinearTransform', () => {
	it( 'returns the identity for no transform', () => {
		expect(
			getStyleLinearTransform( {
				rotate: 'none',
				scale: 'none',
				transform: 'none',
			} )
		).toEqual( { a: 1, b: 0, c: 0, d: 1 } );
	} );

	it( 'applies `rotate`, then `scale`, then `transform`', () => {
		expect(
			round(
				getStyleLinearTransform( {
					rotate: '90deg',
					scale: '2 3',
					transform: 'matrix(1, 0, 1, 1, 0, 0)',
				} )
			)
		).toEqual( { a: 0, b: 2, c: -3, d: 2 } );
	} );

	it( 'reads every angle unit', () => {
		for ( const rotate of [ '0.25turn', '100grad', '1.5708rad' ] ) {
			expect(
				round(
					getStyleLinearTransform( {
						rotate,
						scale: '',
						transform: '',
					} )
				)
			).toEqual( { a: 0, b: 1, c: -1, d: 0 } );
		}
	} );
} );
