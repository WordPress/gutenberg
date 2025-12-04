/**
 * External dependencies
 */
import { get, OKLCH, type PlainColorObject } from 'colorjs.io/fn';

/**
 * Internal dependencies
 */
import './register-color-spaces';
import { solveWithBisect } from './utils';
import { WHITE, BLACK, CONTRAST_EPSILON } from './constants';
import { clampToGamut, getContrast } from './color-utils';
import { type TaperChromaOptions, taperChroma } from './taper-chroma';

/**
 * Difference of contrast values that grows linearly with the Y luminance.
 * We get more precise linear interpolations when we use this.
 * @param c1 First contrast.
 * @param c2 Second contrast.
 * @return Difference of logarithms.
 */
function cdiff( c1: number, c2: number ) {
	return Math.log( c1 / c2 );
}

/**
 * Solve for L such that:
 *  - the L applied to the seed meets the contrast target against the reference
 *  - the search is performed in one direction (ie lighter / darker)
 *  - more constraints can be applied around lightness
 * @param reference
 * @param seed
 * @param target
 * @param direction
 * @param options
 * @param options.lightnessConstraint
 * @param options.lightnessConstraint.type
 * @param options.lightnessConstraint.value
 * @param options.taperChromaOptions
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
	// A target of 1 means same color.
	// A target lower than 1 doesn't make sense.
	if ( target <= 1 ) {
		return {
			color: reference,
			reached: true,
			achieved: 1,
		};
	}

	function getColorForL( l: number ): PlainColorObject {
		let newL = l;
		let newC = get( seed, [ OKLCH, 'c' ] );

		if ( taperChromaOptions ) {
			const tapered = taperChroma( seed, newL, taperChromaOptions );
			// taperChroma returns either { l, c } or a ColorObject
			if ( 'l' in tapered && 'c' in tapered ) {
				newL = tapered.l;
				newC = tapered.c;
			} else {
				// It's already a ColorObject, return it directly
				return tapered;
			}
		}

		return clampToGamut( {
			spaceId: 'oklch',
			coords: [ newL, newC, get( seed, [ OKLCH, 'h' ] ) ],
		} );
	}

	// Set the boundary based on the direction.
	const mostContrastingL = direction === 'lighter' ? 1 : 0;
	const mostContrastingColor = direction === 'lighter' ? WHITE : BLACK;
	const highestContrast = getContrast( reference, mostContrastingColor );

	if ( lightnessConstraint ) {
		// Apply a specific L value.
		// Useful when pinning a step to a specific lightness, of to specify
		// min/max L values.
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

	// Bracket: low fails, high meets.
	// Originally this was seed.oklch.l — although it's an assumption that works
	// only when we know for sure the direction of the search.
	// TODO: can we bring this back to seed.oklch.l ?
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
