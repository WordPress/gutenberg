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

const ANGLE_UNITS: Record< string, number > = {
	deg: 1,
	grad: 0.9,
	rad: 180 / Math.PI,
	turn: 360,
};

function multiply( m: LinearTransform, n: LinearTransform ): LinearTransform {
	return {
		a: m.a * n.a + m.c * n.b,
		b: m.b * n.a + m.d * n.b,
		c: m.a * n.c + m.c * n.d,
		d: m.b * n.c + m.d * n.d,
	};
}

function parseAngleInDegrees( value: string ): number {
	const match = value.match(
		/^(-?[\d.]+(?:e[+-]?\d+)?)(deg|grad|rad|turn)$/
	);
	return match ? parseFloat( match[ 1 ] ) * ANGLE_UNITS[ match[ 2 ] ] : NaN;
}

/**
 * Reads the computed `rotate` property. Only a turn around the z axis keeps
 * the element flat, so any other axis is treated as no rotation.
 *
 * @param value Computed `rotate` value.
 */
function getRotate( value: string ): LinearTransform {
	const parts = value.trim().split( /\s+/ );
	const degrees = parseAngleInDegrees( parts[ parts.length - 1 ] );
	const axis = parts.slice( 0, -1 ).join( ' ' );
	if ( Number.isNaN( degrees ) || ! [ '', 'z', '0 0 1' ].includes( axis ) ) {
		return IDENTITY;
	}
	const angle = ( degrees * Math.PI ) / 180;
	const cos = Math.cos( angle );
	const sin = Math.sin( angle );
	return { a: cos, b: sin, c: -sin, d: cos };
}

function parseScale( value: string ): [ number, number ] {
	const [ x, y = x ] = value
		.trim()
		.split( /\s+/ )
		.map( ( part ) =>
			part.endsWith( '%' ) ? parseFloat( part ) / 100 : parseFloat( part )
		);
	return [ x, y ];
}

function getScale( value: string ): LinearTransform {
	const [ x, y ] = parseScale( value );
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
 * Maps 2D directions and deltas from an element's axes to its parent's axes.
 * Translation and transform origin only affect positions.
 *
 * @param style The element's computed style.
 *
 * @return The linear transform from the element's axes to its parent's.
 */
export function getStyleLinearTransform(
	style: TransformStyle
): LinearTransform {
	// CSS applies `rotate`, then `scale`, then `transform`.
	let matrix = getRotate( style.rotate || 'none' );
	matrix = multiply( matrix, getScale( style.scale || 'none' ) );
	return multiply( matrix, getTransform( style.transform || 'none' ) );
}

/**
 * Whether the element's own planar transform keeps its edges parallel to its
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
 * document's viewport axes. Includes ancestor transforms. Only in-plane
 * rotations from the individual CSS `rotate` property contribute.
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

const ROTATE_AXES: Record< string, [ number, number, number ] > = {
	'': [ 0, 0, 1 ],
	x: [ 1, 0, 0 ],
	y: [ 0, 1, 0 ],
	z: [ 0, 0, 1 ],
};

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
		const parts = rotate.split( ' ' );
		const angle = parseAngleInDegrees( parts.pop()! );
		const [ x, y, z ] =
			ROTATE_AXES[ parts.join( ' ' ) ] ??
			parts.map( ( value ) => parseFloat( value ) );
		matrix.rotateAxisAngleSelf( x, y, z, angle );
	}

	if ( scale !== 'none' ) {
		const [ x, y ] = parseScale( scale );
		matrix.scaleSelf( x, y );
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
