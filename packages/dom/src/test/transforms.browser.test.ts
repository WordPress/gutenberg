import { afterEach, describe, expect, it } from 'vitest';
import {
	getBorderBoxPointTransform,
	getViewportVectorTransform,
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

describe( 'getViewportVectorTransform', () => {
	afterEach( () => {
		document.body.innerHTML = '';
	} );

	it( 'returns the identity for an untransformed element', () => {
		expect(
			round( getViewportVectorTransform( createNested( '' ) ) )
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
				getViewportVectorTransform( createNested( 'rotate: 90deg' ) )
			)
		).toEqual( { a: 0, b: 1, c: -1, d: 0 } );
	} );

	it( 'reads the scale property', () => {
		expect(
			round( getViewportVectorTransform( createNested( 'scale: 2 3' ) ) )
		).toEqual( { a: 2, b: 0, c: 0, d: 3 } );
	} );

	it( 'ignores translation', () => {
		expect(
			round(
				getViewportVectorTransform(
					createNested(
						'translate: 40px 10px; transform: translateX(20px)'
					)
				)
			)
		).toEqual( { a: 1, b: 0, c: 0, d: 1 } );
	} );

	it( 'returns the exact identity for turns that cancel out', () => {
		expect(
			getViewportVectorTransform(
				createNested( 'rotate: 45deg', 'rotate: -45deg' )
			)
		).toEqual( { a: 1, b: 0, c: 0, d: 1 } );
	} );

	it( 'combines the element with its ancestors', () => {
		expect(
			round(
				getViewportVectorTransform(
					createNested( 'rotate: 45deg', 'rotate: 45deg; scale: 2' )
				)
			)
		).toEqual( { a: 0, b: 2, c: -2, d: 0 } );
	} );

	it( 'projects a turn out of the page the way the browser paints it', () => {
		const element = createNested(
			'',
			'height: 40px; rotate: x 60deg; transform-origin: 0 0;'
		);
		const point = getBorderBoxPointTransform( element )?.transformPoint( {
			x: 0,
			y: 40,
		} );
		const matrix = getViewportVectorTransform( element );
		const paintedHeight = element.getBoundingClientRect().height;
		expect( paintedHeight ).toBeCloseTo( 20 );
		expect( point?.y ).toBeCloseTo( paintedHeight );
		expect( matrix.d * element.offsetHeight ).toBeCloseTo( paintedHeight );
		expect( round( matrix ) ).toEqual( { a: 1, b: 0, c: 0, d: 0.5 } );
	} );

	it.each( [
		'rotate: 1 1 0 45deg',
		'rotate: x 60deg; transform: rotateY(60deg)',
		'rotate: x 60deg; scale: 2 1 3; transform: rotateY(60deg)',
	] )(
		'matches the linear part of the border-box point transform without perspective for %s',
		( style ) => {
			const element = createNested( '', style );
			const { a, b, c, d } = getBorderBoxPointTransform( element )!;
			expect( round( getViewportVectorTransform( element ) ) ).toEqual(
				round( { a, b, c, d } )
			);
		}
	);
} );
