import { get, OKLCH, type PlainColorObject } from 'colorjs.io/fn';
import { solveWithBisect } from './utils.ts';
import { WHITE, BLACK, CONTRAST_EPSILON } from './constants.ts';
import { clampToGamut, getContrast } from './color-utils.ts';
import { type TaperChromaOptions, taperChroma } from './taper-chroma.ts';

/**
 * Signed log contrast ratio used as search error. Zero meets the target.
 *
 * @param c1 Achieved contrast.
 * @param c2 Target contrast.
 */
function cdiff( c1: number, c2: number ) {
	return Math.log( c1 / c2 );
}

/**
 * Search OKLCH lightness toward black or white for a WCAG target, using the
 * seed's hue and optional chroma taper. If the endpoint cannot reach the target,
 * return it with a deficit. Results use search tolerance, not final hex checks.
 *
 * @param reference                         Color to contrast against.
 * @param seed                              OKLCH seed supplying hue and chroma.
 * @param target                            WCAG contrast ratio, already padded by the caller.
 * @param direction                         Endpoint to search toward.
 * @param options                           Optional lightness and chroma settings.
 * @param options.lightnessConstraint       Exact lightness to try before searching.
 * @param options.lightnessConstraint.type  Whether to force lightness even if contrast fails.
 * @param options.lightnessConstraint.value OKLCH lightness to try.
 * @param options.taperChromaOptions        Chroma taper; omitted to retain seed chroma before gamut mapping.
 */
export function findColorMeetingRequirements(
	reference: PlainColorObject,
	seed: PlainColorObject,
	target: number,
	direction: 'lighter' | 'darker',
	{
		lightnessConstraint,
		taperChromaOptions,
	}: {
		lightnessConstraint?: {
			type: 'force' | 'onlyIfSucceeds';
			value: number;
		};
		taperChromaOptions?: TaperChromaOptions;
	} = {}
): {
	color: PlainColorObject;
	reached: boolean;
	achieved: number;
	deficit?: number;
} {
	// A target of 1 means reuse, not a lightness search.
	if ( target <= 1 ) {
		return {
			color: reference,
			reached: true,
			achieved: 1,
		};
	}
	const seedChroma = get( seed, [ OKLCH, 'c' ] );
	const seedHue = get( seed, [ OKLCH, 'h' ] );

	function getColorForL( l: number ): PlainColorObject {
		let newL = l;
		let newC = seedChroma;

		if ( taperChromaOptions ) {
			const tapered = taperChroma( seed, newL, taperChromaOptions );
			if ( 'l' in tapered && 'c' in tapered ) {
				newL = tapered.l;
				newC = tapered.c;
			} else {
				return tapered;
			}
		}

		return clampToGamut( {
			space: OKLCH,
			coords: [ newL, newC, seedHue ],
			alpha: seed.alpha,
		} );
	}

	const mostContrastingL = direction === 'lighter' ? 1 : 0;
	const mostContrastingColor = direction === 'lighter' ? WHITE : BLACK;
	const highestContrast = getContrast( reference, mostContrastingColor );

	if ( lightnessConstraint ) {
		const colorWithExactL = getColorForL( lightnessConstraint.value );
		const exactLContrast = getContrast( reference, colorWithExactL );
		const exactLContrastMeetsTarget =
			cdiff( exactLContrast, target ) >= -CONTRAST_EPSILON;

		// If the L constraint is of "force" type, apply it even when it doesn't
		// meet the contrast target.
		if (
			exactLContrastMeetsTarget ||
			lightnessConstraint.type === 'force'
		) {
			return {
				color: colorWithExactL,
				reached: exactLContrastMeetsTarget,
				achieved: exactLContrast,
				deficit: exactLContrastMeetsTarget
					? cdiff( exactLContrast, highestContrast )
					: cdiff( target, exactLContrast ),
			};
		}
	}

	// If even the most contrasting color can't reach the target, the target is unreachable.
	// On the other hand, if the contrast is very close to the target, we consider it reached.
	if ( cdiff( highestContrast, target ) <= CONTRAST_EPSILON ) {
		return {
			color: mostContrastingColor,
			reached: cdiff( highestContrast, target ) >= -CONTRAST_EPSILON,
			achieved: highestContrast,
			deficit: cdiff( target, highestContrast ),
		};
	}

	// Search from the reference lightness toward the selected endpoint.
	const lowerL = get( reference, [ OKLCH, 'l' ] );
	const lowerContrast = cdiff( 1, target );
	const upperL = mostContrastingL;
	const upperContrast = cdiff( highestContrast, target );

	const bestColor = solveWithBisect(
		getColorForL,
		( c ) => cdiff( getContrast( reference, c ), target ),
		lowerL,
		lowerContrast,
		upperL,
		upperContrast
	);

	return {
		color: bestColor,
		reached: true,
		achieved: target,
		// Negative number that specifies how much room we have.
		deficit: cdiff( target, highestContrast ),
	};
}
