/**
 * The 2D linear part of a transform, in `DOMMatrix` order. A vector
 * `( x, y )` maps to `( a * x + c * y, b * x + d * y )`.
 */
type LinearTransform = {
	a: number;
	b: number;
	c: number;
	d: number;
};

type TransformStyle = Pick<
	CSSStyleDeclaration,
	'rotate' | 'scale' | 'transform'
>;

const IDENTITY: LinearTransform = { a: 1, b: 0, c: 0, d: 1 };

// `DOMMatrix` takes degrees. The vector helpers work in radians, read with
// these factors so that turns in the page cancel out exactly.
const DEGREES_PER_UNIT: Record< string, number > = {
	deg: 1,
	grad: 0.9,
	rad: 180 / Math.PI,
	turn: 360,
};

const RADIANS_PER_UNIT: Record< string, number > = {
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

function parseAngle( value: string, units: Record< string, number > ): number {
	const match = value.match(
		/^(-?[\d.]+(?:e[+-]?\d+)?)(deg|grad|rad|turn)$/
	);
	return match ? parseFloat( match[ 1 ] ) * units[ match[ 2 ] ] : NaN;
}

const ROTATE_AXES: Record< string, [ number, number, number ] > = {
	'': [ 0, 0, 1 ],
	x: [ 1, 0, 0 ],
	y: [ 0, 1, 0 ],
	z: [ 0, 0, 1 ],
};

/**
 * Splits a computed `rotate` value into its axis and angle.
 *
 * @param value Computed `rotate` value, other than `none`.
 * @param units The angle per CSS unit, in the unit wanted.
 */
function parseRotate(
	value: string,
	units: Record< string, number >
): [ number, number, number, number ] {
	const parts = value.trim().split( /\s+/ );
	const angle = parseAngle( parts.pop()!, units );
	const [ x, y, z ] =
		ROTATE_AXES[ parts.join( ' ' ) ] ??
		parts.map( ( part ) => parseFloat( part ) );
	return [ x, y, z, angle ];
}

function parseScale( value: string ): [ number, number, number ] {
	const [ x, y = x, z = 1 ] = value
		.trim()
		.split( /\s+/ )
		.map( ( part ) =>
			part.endsWith( '%' ) ? parseFloat( part ) / 100 : parseFloat( part )
		);
	return [ x, y, z ];
}

type Vector3 = [ number, number, number ];

/**
 * A 3D linear transform, as the images of the x, y and z axes.
 */
type LinearTransform3D = [ Vector3, Vector3, Vector3 ];

const IDENTITY_3D: LinearTransform3D = [
	[ 1, 0, 0 ],
	[ 0, 1, 0 ],
	[ 0, 0, 1 ],
];

/**
 * Applies `m` after `n`.
 *
 * @param m The outer transform.
 * @param n The inner transform.
 */
function multiply3D(
	m: LinearTransform3D,
	n: LinearTransform3D
): LinearTransform3D {
	return n.map(
		( [ x, y, z ] ) =>
			[ 0, 1, 2 ].map(
				( i ) => m[ 0 ][ i ] * x + m[ 1 ][ i ] * y + m[ 2 ][ i ] * z
			) as Vector3
	) as LinearTransform3D;
}

function getRotate( value: string ): LinearTransform3D {
	if ( value === 'none' ) {
		return IDENTITY_3D;
	}
	const [ x, y, z, angle ] = parseRotate( value, RADIANS_PER_UNIT );
	const length = Math.hypot( x, y, z );
	const [ ux, uy, uz ] = [ x / length, y / length, z / length ];
	const cos = Math.cos( angle );
	const sin = Math.sin( angle );
	const t = 1 - cos;
	const matrix: LinearTransform3D = [
		[ cos + ux * ux * t, ux * uy * t + uz * sin, ux * uz * t - uy * sin ],
		[ ux * uy * t - uz * sin, cos + uy * uy * t, uy * uz * t + ux * sin ],
		[ ux * uz * t + uy * sin, uy * uz * t - ux * sin, cos + uz * uz * t ],
	];
	if ( ! matrix.flat().every( Number.isFinite ) ) {
		return IDENTITY_3D;
	}
	// A turn in the page keeps the floating-point values of `Math.cos()` and
	// `Math.sin()`, so turns that cancel out give the exact identity. A
	// quarter turn out of the page drops the rounding error of the
	// trigonometry and the axis length, so it flattens exactly, as it does in
	// a serialized `matrix3d()`.
	const quarters = ( 2 * angle ) / Math.PI;
	if (
		( ux === 0 && uy === 0 ) ||
		Math.abs( quarters - Math.round( quarters ) ) > 1e-9
	) {
		return matrix;
	}
	return matrix.map( ( column ) =>
		column.map( ( entry ) => Math.round( entry * 1e12 ) / 1e12 + 0 )
	) as LinearTransform3D;
}

function getScale( value: string ): LinearTransform3D {
	const [ x, y, z ] = parseScale( value );
	if ( ! [ x, y, z ].every( Number.isFinite ) ) {
		return IDENTITY_3D;
	}
	return [
		[ x, 0, 0 ],
		[ 0, y, 0 ],
		[ 0, 0, z ],
	];
}

/**
 * Reads the computed `transform` property, which is always `none`,
 * `matrix()` or `matrix3d()`.
 *
 * @param value Computed `transform` value.
 */
function getTransform( value: string ): LinearTransform3D {
	const match = value.match( /^matrix(3d)?\((.+)\)$/ );
	if ( ! match ) {
		return IDENTITY_3D;
	}
	const n = match[ 2 ].split( ',' ).map( parseFloat );
	if ( ! match[ 1 ] ) {
		return [
			[ n[ 0 ], n[ 1 ], 0 ],
			[ n[ 2 ], n[ 3 ], 0 ],
			[ 0, 0, 1 ],
		];
	}
	return [
		[ n[ 0 ], n[ 1 ], n[ 2 ] ],
		[ n[ 4 ], n[ 5 ], n[ 6 ] ],
		[ n[ 8 ], n[ 9 ], n[ 10 ] ],
	];
}

/**
 * Maps 2D directions and deltas from an element's axes to its parent's axes.
 * Translation and transform origin only affect positions. The element's own
 * properties combine in 3D before the result is flattened onto the page.
 *
 * @param style The element's computed style.
 *
 * @return The linear transform from the element's axes to its parent's.
 */
export function getStyleLinearTransform(
	style: TransformStyle
): LinearTransform {
	// CSS applies `rotate`, then `scale`, then `transform`.
	const [ [ a, b ], [ c, d ] ] = multiply3D(
		multiply3D(
			getRotate( style.rotate || 'none' ),
			getScale( style.scale || 'none' )
		),
		getTransform( style.transform || 'none' )
	);
	return { a, b, c, d };
}

/**
 * Whether the element's own transform keeps its edges parallel to its
 * parent's axes, including quarter turns.
 *
 * @param style The element's computed style.
 */
export function isStyleTransformAxisAligned( style: TransformStyle ): boolean {
	const { a, b, c, d } = getStyleLinearTransform( style );
	return (
		( Math.abs( b ) < 1e-5 && Math.abs( c ) < 1e-5 ) ||
		( Math.abs( a ) < 1e-5 && Math.abs( d ) < 1e-5 )
	);
}

/**
 * Maps 2D directions and distances from the element's local axes to its
 * document's viewport axes. Includes ancestor transforms, and projects turns
 * out of the page onto it, as `getBorderBoxPointTransform` does when there is
 * no perspective.
 *
 * @param element The element to measure.
 */
export function getViewportVectorTransform(
	element: Element
): LinearTransform {
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
		matrix = multiply(
			getStyleLinearTransform( view.getComputedStyle( node ) ),
			matrix
		);
	}
	return matrix;
}

function parseLength( value: string, size: number ) {
	if ( value.endsWith( '%' ) ) {
		return ( parseFloat( value ) / 100 ) * size;
	}
	return value.endsWith( 'px' ) ? parseFloat( value ) : NaN;
}

/**
 * Builds the matrix an element's own `translate`, `rotate`, `scale` and
 * `transform` apply to its border box, about its transform origin.
 *
 * @param element Element.
 * @param style   Computed style of the element.
 *
 * @return The matrix, or undefined when the element is not transformed or
 *         a value can't be read.
 */
function getOwnTransform( element: HTMLElement, style: CSSStyleDeclaration ) {
	const {
		translate = 'none',
		rotate = 'none',
		scale = 'none',
		transform = 'none',
	} = style;

	if (
		translate === 'none' &&
		rotate === 'none' &&
		scale === 'none' &&
		transform === 'none'
	) {
		return;
	}

	const { offsetWidth: width, offsetHeight: height } = element;
	const [ originX, originY ] = style.transformOrigin
		.split( ' ' )
		.map( ( value ) => parseFloat( value ) );
	// CSS applies `translate`, then `rotate`, then `scale`, then `transform`.
	const matrix = new window.DOMMatrix().translateSelf( originX, originY );

	if ( translate !== 'none' ) {
		const [ x, y = '0px' ] = translate.split( ' ' );
		matrix.translateSelf(
			parseLength( x, width ),
			parseLength( y, height )
		);
	}

	if ( rotate !== 'none' ) {
		matrix.rotateAxisAngleSelf(
			...parseRotate( rotate, DEGREES_PER_UNIT )
		);
	}

	if ( scale !== 'none' ) {
		matrix.scaleSelf( ...parseScale( scale ) );
	}

	if ( transform !== 'none' ) {
		matrix.multiplySelf( new window.DOMMatrix( transform ) );
	}

	matrix.translateSelf( -originX, -originY );

	// The page is painted flat, so only the 2D part reaches the screen.
	const { a, b, c, d, e, f } = matrix;
	return [ a, b, c, d, e, f ].every( Number.isFinite )
		? new window.DOMMatrix( [ a, b, c, d, e, f ] )
		: undefined;
}

/**
 * Maps a local border-box point to its painted position within the same box's
 * coordinate system. Includes translation and transform origin, and projects
 * out-of-plane rotations onto the x/y plane. Ancestor transforms are applied
 * separately by the caller. Returns undefined when there is no usable transform.
 *
 * @param element Element whose border box is measured.
 */
export function getBorderBoxPointTransform( element: Element ) {
	const view = element.ownerDocument.defaultView;

	if ( ! view || ! ( 'offsetWidth' in element ) ) {
		return;
	}

	return getOwnTransform(
		element as HTMLElement,
		view.getComputedStyle( element )
	);
}
