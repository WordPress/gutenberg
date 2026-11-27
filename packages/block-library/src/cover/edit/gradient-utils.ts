import { colord } from 'colord';

// Computed styles serialize sRGB colors as `rgb()` or `rgba()`, followed by the
// stop's position when it has one.
const GRADIENT_STOP = /(rgba?\([^)]*\))(?:\s+(-?[\d.]+)%)?/g;
const UNREADABLE_GRADIENT =
	/url\(|\b(?:oklch|oklab|lch|lab|hwb|color|color-mix|light-dark)\(|currentcolor/i;

/**
 * Resolves a gradient to its computed value, so that any `var()`, hex or named
 * color in it is serialized as `rgb()` or `rgba()`.
 *
 * @param gradient      CSS gradient.
 * @param ownerDocument Document holding the block, whose styles define the presets.
 * @return Computed `background-image` value.
 */
export function getComputedGradient(
	gradient: string,
	ownerDocument: Document
): string {
	const element = ownerDocument.createElement( 'div' );
	element.style.display = 'none';
	element.style.backgroundImage = gradient;
	ownerDocument.body.append( element );
	const computedGradient =
		ownerDocument.defaultView?.getComputedStyle( element ).backgroundImage;
	element.remove();
	return computedGradient ?? 'none';
}

/**
 * Fills in the positions of gradient stops as CSS does: the first and last stops
 * default to the ends of the gradient, the stops between them are spread evenly,
 * and positions never go backwards.
 *
 * @param positions Stop positions as percentages, where they are set.
 * @return The position of every stop.
 */
function getStopPositions( positions: Array< number | undefined > ): number[] {
	const lastIndex = positions.length - 1;
	const resolved: number[] = [];
	positions.forEach( ( position, index ) => {
		const previous = resolved[ index - 1 ] ?? 0;
		let current = position;
		if ( current === undefined && index === 0 ) {
			current = 0;
		} else if ( current === undefined && index === lastIndex ) {
			current = 100;
		} else if ( current === undefined ) {
			const following = positions.slice( index + 1 );
			const offset = following.findIndex(
				( candidate ) => candidate !== undefined
			);
			const next = following[ offset ] ?? 100;
			const gaps = offset === -1 ? following.length + 1 : offset + 2;
			current = previous + ( next - previous ) / gaps;
		}
		resolved.push( Math.max( current, previous ) );
	} );
	return resolved;
}

/**
 * Computes the average color along a gradient, weighting each stop by the
 * distance it covers. Only single gradients with `rgb()` or `rgba()` colors can
 * be read, which is what `getComputedGradient` returns for most gradients.
 *
 * @param computedGradient Computed `background-image` value.
 * @return CSS color string, or undefined if the gradient can't be read.
 */
export function getAverageGradientColor(
	computedGradient: string
): string | undefined {
	if (
		UNREADABLE_GRADIENT.test( computedGradient ) ||
		computedGradient.split( 'gradient(' ).length !== 2
	) {
		return undefined;
	}

	const matches = Array.from( computedGradient.matchAll( GRADIENT_STOP ) );
	if ( ! matches.length ) {
		return undefined;
	}

	const positions = getStopPositions(
		matches.map( ( [ , , position ] ) =>
			position === undefined
				? undefined
				: Math.min( Math.max( parseFloat( position ), 0 ), 100 )
		)
	);
	const stops = matches.map( ( [ , color ], index ) => ( {
		color: colord( color ).toRgb(),
		position: positions[ index ],
	} ) );

	// The first and last colors extend to the ends of the gradient.
	const points = [
		{ ...stops[ 0 ], position: 0 },
		...stops,
		{ ...stops[ stops.length - 1 ], position: 100 },
	];
	// Colors are premultiplied, as CSS interpolates them, so that a transparent
	// stop doesn't contribute its color.
	const sum = { r: 0, g: 0, b: 0, a: 0 };
	for ( let index = 1; index < points.length; index++ ) {
		const { color: from, position: start } = points[ index - 1 ];
		const { color: to, position: end } = points[ index ];
		const weight = ( end - start ) / 200;
		sum.r += ( from.r * from.a + to.r * to.a ) * weight;
		sum.g += ( from.g * from.a + to.g * to.a ) * weight;
		sum.b += ( from.b * from.a + to.b * to.a ) * weight;
		sum.a += ( from.a + to.a ) * weight;
	}
	if ( sum.a === 0 ) {
		return colord( { r: 0, g: 0, b: 0, a: 0 } ).toRgbString();
	}
	return colord( {
		r: sum.r / sum.a,
		g: sum.g / sum.a,
		b: sum.b / sum.a,
		a: sum.a,
	} ).toRgbString();
}
