import { afterEach, describe, expect, it } from 'vitest';
import {
	getAxisScale,
	getHandleCursor,
	getResizeStep,
	getScreenTransform,
	getStyleTransform,
	getTransformedHandleStyles,
	measureGain,
	toLocalDelta,
} from '../utils';

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

describe( 'getStyleTransform', () => {
	it( 'returns the identity for no transform', () => {
		expect(
			getStyleTransform( {
				rotate: 'none',
				scale: 'none',
				transform: 'none',
			} )
		).toEqual( { a: 1, b: 0, c: 0, d: 1 } );
	} );

	it( 'applies `rotate`, then `scale`, then `transform`', () => {
		expect(
			round(
				getStyleTransform( {
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
					getStyleTransform( { rotate, scale: '', transform: '' } )
				)
			).toEqual( { a: 0, b: 1, c: -1, d: 0 } );
		}
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

const IDENTITY = { a: 1, b: 0, c: 0, d: 1 };

function rotation( degrees: number ) {
	const angle = ( degrees * Math.PI ) / 180;
	return {
		a: Math.cos( angle ),
		b: Math.sin( angle ),
		c: -Math.sin( angle ),
		d: Math.cos( angle ),
	};
}

describe( 'getHandleCursor', () => {
	it( 'keeps the default cursor for an untransformed box', () => {
		expect( getHandleCursor( IDENTITY, 'bottom' ) ).toBeUndefined();
		expect( getHandleCursor( IDENTITY, 'topLeft' ) ).toBeUndefined();
	} );

	it( 'keeps the default cursor when the handle still points the same way', () => {
		expect(
			getHandleCursor( { a: 2, b: 0, c: 0, d: 2 }, 'right' )
		).toBeUndefined();
		expect( getHandleCursor( rotation( 180 ), 'bottom' ) ).toBeUndefined();
		expect( getHandleCursor( rotation( 10 ), 'bottom' ) ).toBeUndefined();
	} );

	it( 'turns a side handle a quarter turn', () => {
		expect( getHandleCursor( rotation( 90 ), 'bottom' ) ).toBe(
			'ew-resize'
		);
		expect( getHandleCursor( rotation( 90 ), 'right' ) ).toBe(
			'ns-resize'
		);
	} );

	it( 'picks the nearest diagonal', () => {
		expect( getHandleCursor( rotation( 45 ), 'right' ) ).toBe(
			'nwse-resize'
		);
		expect( getHandleCursor( rotation( 30 ), 'bottom' ) ).toBe(
			'nesw-resize'
		);
	} );

	it( 'turns a corner handle', () => {
		expect( getHandleCursor( rotation( 45 ), 'bottomRight' ) ).toBe(
			'ns-resize'
		);
		expect( getHandleCursor( rotation( 90 ), 'bottomRight' ) ).toBe(
			'nesw-resize'
		);
	} );
} );

describe( 'getAxisScale', () => {
	it( 'measures each axis through a rotation', () => {
		const { a, b, c, d } = rotation( 30 );
		const scale = getAxisScale( {
			a: a * 2,
			b: b * 2,
			c: c * 3,
			d: d * 3,
		} );
		expect( scale.x ).toBeCloseTo( 2 );
		expect( scale.y ).toBeCloseTo( 3 );
	} );
} );

describe( 'getResizeStep', () => {
	it( 'grows the bottom edge of a quarter turn by a leftward offset', () => {
		const step = getResizeStep(
			rotation( 90 ),
			'bottom',
			{ x: -10, y: 0 },
			1
		);
		expect( step.width ).toBe( 0 );
		expect( step.height ).toBeCloseTo( 10 );
	} );

	it( 'shrinks the box when the left handle moves right', () => {
		expect( getResizeStep( IDENTITY, 'left', { x: 10, y: 0 }, 1 ) ).toEqual(
			{ width: -10, height: 0 }
		);
	} );

	it( 'divides by the gain', () => {
		expect(
			getResizeStep( IDENTITY, 'bottomRight', { x: 10, y: 5 }, 0.5 )
		).toEqual( { width: 20, height: 10 } );
	} );
} );

describe( 'measureGain', () => {
	it( 'is one when the handle moves as the transform predicts', () => {
		expect(
			measureGain(
				{ a: 2, b: 0, c: 0, d: 2 },
				'bottom',
				{ width: 0, height: 10 },
				{ x: 0, y: 20 }
			)
		).toBe( 1 );
	} );

	it( 'measures a handle that lags behind a centred transform origin', () => {
		// Turned a quarter around its centre, the bottom edge moves half as far.
		expect(
			measureGain(
				rotation( 90 ),
				'bottom',
				{ width: 0, height: 10 },
				{ x: -5, y: 5 }
			)
		).toBeCloseTo( 0.5 );
	} );

	it( 'ignores a size that barely changed', () => {
		expect(
			measureGain(
				IDENTITY,
				'right',
				{ width: 0.5, height: 0 },
				{ x: 3, y: 0 }
			)
		).toBeUndefined();
	} );
} );

describe( 'getTransformedHandleStyles', () => {
	it( 'leaves an untransformed box alone', () => {
		expect( getTransformedHandleStyles( IDENTITY ) ).toBeUndefined();
	} );

	it( 'counter-scales the handles of a scaled box', () => {
		const styles = getTransformedHandleStyles( { a: 2, b: 0, c: 0, d: 4 } );
		expect( styles?.bottomRight ).toEqual( { scale: '0.5 0.25' } );
		expect( styles?.bottom ).toEqual( {
			scale: '1 0.25',
			'--wp-components-resizable-box-handle-dot-scale': '0.5 1',
		} );
		expect( styles?.left ).toEqual( {
			scale: '0.5 1',
			'--wp-components-resizable-box-handle-dot-scale': '1 0.25',
		} );
	} );

	it( 'only turns the cursors of a rotated box', () => {
		const styles = getTransformedHandleStyles( rotation( 90 ) );
		expect( styles?.bottom ).toEqual( { cursor: 'ew-resize' } );
	} );
} );
