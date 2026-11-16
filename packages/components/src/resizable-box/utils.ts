/**
 * The 2D linear part of a transform, in `DOMMatrix` order: a local vector
 * `( x, y )` lands on screen at `( a * x + c * y, b * x + d * y )`.
 */
export type LinearTransform = {
	a: number;
	b: number;
	c: number;
	d: number;
};

const IDENTITY: LinearTransform = { a: 1, b: 0, c: 0, d: 1 };

const ANGLE_UNITS: Record< string, number > = {
	deg: Math.PI / 180,
	grad: Math.PI / 200,
	rad: 1,
	turn: 2 * Math.PI,
};

function multiply( m: LinearTransform, n: LinearTransform ): LinearTransform {
	return {
		a: m.a * n.a + m.c * n.b,
		b: m.b * n.a + m.d * n.b,
		c: m.a * n.c + m.c * n.d,
		d: m.b * n.c + m.d * n.d,
	};
}

function parseAngle( value: string ): number | undefined {
	const match = value.match( /^(-?[\d.]+(?:e-?\d+)?)(deg|grad|rad|turn)$/ );
	return match
		? parseFloat( match[ 1 ] ) * ANGLE_UNITS[ match[ 2 ] ]
		: undefined;
}

/**
 * Reads the computed `rotate` property. Only a turn around the z axis keeps
 * the element flat, so any other axis is treated as no rotation.
 *
 * @param value Computed `rotate` value.
 */
function getRotate( value: string ): LinearTransform {
	const parts = value.trim().split( /\s+/ );
	const angle = parseAngle( parts[ parts.length - 1 ] );
	const axis = parts.slice( 0, -1 ).join( ' ' );
	if ( angle === undefined || ! [ '', 'z', '0 0 1' ].includes( axis ) ) {
		return IDENTITY;
	}
	const cos = Math.cos( angle );
	const sin = Math.sin( angle );
	return { a: cos, b: sin, c: -sin, d: cos };
}

function getScale( value: string ): LinearTransform {
	const [ x, y = x ] = value
		.trim()
		.split( /\s+/ )
		.map( ( part ) =>
			part.endsWith( '%' ) ? parseFloat( part ) / 100 : parseFloat( part )
		);
	if ( ! Number.isFinite( x ) || ! Number.isFinite( y ) ) {
		return IDENTITY;
	}
	return { a: x, b: 0, c: 0, d: y };
}

/**
 * Reads the computed `transform` property, which is always `none`,
 * `matrix()` or `matrix3d()`.
 *
 * @param value Computed `transform` value.
 */
function getTransform( value: string ): LinearTransform {
	const match = value.match( /^matrix(3d)?\((.+)\)$/ );
	if ( ! match ) {
		return IDENTITY;
	}
	const numbers = match[ 2 ].split( ',' ).map( parseFloat );
	const [ a, b, c, d ] = match[ 1 ]
		? [ numbers[ 0 ], numbers[ 1 ], numbers[ 4 ], numbers[ 5 ] ]
		: numbers;
	return { a, b, c, d };
}

/**
 * Returns how an element and its ancestors rotate and scale it on screen.
 * Translation is left out, since it moves the element without changing
 * which way its edges face.
 *
 * @param element The element to measure.
 *
 * @return The linear transform from the element's axes to screen axes.
 */
export function getScreenTransform( element: Element ): LinearTransform {
	const view = element.ownerDocument.defaultView;
	let matrix = IDENTITY;
	if ( ! view ) {
		return matrix;
	}
	for (
		let node: Element | null = element;
		node;
		node = node.parentElement
	) {
		const style = view.getComputedStyle( node );
		// CSS applies `rotate`, then `scale`, then `transform`.
		let own = getRotate( style.rotate || 'none' );
		own = multiply( own, getScale( style.scale || 'none' ) );
		own = multiply( own, getTransform( style.transform || 'none' ) );
		matrix = multiply( own, matrix );
	}
	return matrix;
}

/**
 * Maps a pointer movement on screen into an element's own axes.
 *
 * @param matrix The element's screen transform.
 * @param x      Horizontal movement on screen.
 * @param y      Vertical movement on screen.
 *
 * @return The movement along the element's own axes.
 */
export function toLocalDelta(
	matrix: LinearTransform,
	x: number,
	y: number
): { x: number; y: number } {
	const determinant = matrix.a * matrix.d - matrix.b * matrix.c;
	if ( ! determinant ) {
		return { x, y };
	}
	return {
		x: ( matrix.d * x - matrix.c * y ) / determinant,
		y: ( matrix.a * y - matrix.b * x ) / determinant,
	};
}
