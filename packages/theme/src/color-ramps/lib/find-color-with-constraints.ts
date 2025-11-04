/**
 * External dependencies
 */
// Disable reason: ESLint resolver can't handle `exports`. Import resolver
// checking is redundant in TypeScript files.
// eslint-disable-next-line import/no-unresolved
import { get, OKLCH, type ColorTypes } from 'colorjs.io/fn';

/**
 * Internal dependencies
 */
import './register-color-spaces';
import { clampToGamut } from './utils';
import {
	WHITE,
	BLACK,
	LIGHTNESS_EPSILON,
	MAX_BISECTION_ITERATIONS,
} from './constants';
import { getContrast } from './color-utils';
import { type TaperChromaOptions, taperChroma } from './taper-chroma';

/**
 * Solve for L such that:
 *  - the L applied to the seed meets the contrast target against the reference
 *  - the search is performed in one direction (ie lighter / darker)
 *  - more constraints can be applied around lightness
 *  - chroma could be tapered
 * @param reference
 * @param seed
 * @param target
 * @param direction
 * @param options
 * @param options.strict
 * @param options.lightnessConstraint
 * @param options.lightnessConstraint.type
 * @param options.lightnessConstraint.value
 * @param options.taperChromaOptions
 */
export function findColorMeetingRequirements(
	reference: ColorTypes,
	seed: ColorTypes,
	target: number,
	direction: 'lighter' | 'darker',
	{
		lightnessConstraint,
		taperChromaOptions,
		strict = true,
	}: {
		lightnessConstraint?: {
			type: 'force' | 'onlyIfSucceeds';
			value: number;
		};
		taperChromaOptions?: TaperChromaOptions;
		strict?: boolean;
	} = {}
): { color: ColorTypes; reached: boolean; achieved: number } {
	// A target of 1 means same color.
	// A target lower than 1 doesn't make sense.
	if ( target <= 1 ) {
		return { color: seed, reached: true, achieved: 1 };
	}

	function getColorForL( l: number ): ColorTypes {
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

	if ( lightnessConstraint ) {
		// Apply a specific L value.
		// Useful when pinning a step to a specific lightness, of to specify
		// min/max L values.
		const colorWithExactL = getColorForL( lightnessConstraint.value );
		const exactLContrast = getContrast( reference, colorWithExactL );

		// If the L constraint is of "force" type, apply it even when it doesn't
		// meet the contrast target.
		if (
			lightnessConstraint.type === 'force' ||
			exactLContrast >= target
		) {
			return {
				color: colorWithExactL,
				reached: exactLContrast >= target,
				achieved: exactLContrast,
			};
		}
	}

	// Set the boundary based on the direction.
	const mostContrastingL = direction === 'lighter' ? 1 : 0;
	const mostContrastingColor = direction === 'lighter' ? WHITE : BLACK;
	const highestContrast = getContrast( reference, mostContrastingColor );

	// If even the most contrasting color can't reach the target,
	// the target is unreachable.
	if ( highestContrast < target ) {
		if ( strict ) {
			throw new Error(
				`Contrast target ${ target.toFixed(
					2
				) }:1 unreachable in ${ direction } direction` +
					`(boundary achieves ${ highestContrast.toFixed( 3 ) }:1).`
			);
		}

		return {
			color: mostContrastingColor,
			reached: false,
			achieved: highestContrast,
		};
	}

	// Bracket: low fails, high meets.
	// Originally this was seed.oklch.l — although it's an assumption that works
	// only when we know for sure the direction of the search.
	// TODO: can we bring this back to seed.oklch.l ?
	let worseL = get( reference, [ OKLCH, 'l' ] );
	let worseContrast = 1;
	let replacedWorse = false;
	let betterL = mostContrastingL;
	let betterContrast = highestContrast;
	let replacedBetter = false;

	let bestColor: ColorTypes = mostContrastingColor;
	let bestContrast = highestContrast;

	for ( let i = 0; i < MAX_BISECTION_ITERATIONS; i++ ) {
		// Linear interpolation between worse and better L values, weighted by the contrast difference.
		const newL =
			( worseL * ( betterContrast - target ) -
				betterL * ( worseContrast - target ) ) /
			( betterContrast - worseContrast );

		bestColor = getColorForL( newL );
		bestContrast = getContrast( reference, bestColor );

		if ( Math.abs( bestContrast - target ) <= LIGHTNESS_EPSILON ) {
			break;
		}

		// Update one of the boundary L values, using the Illinois method.
		if ( bestContrast >= target ) {
			betterL = newL;
			betterContrast = bestContrast;
			if ( replacedBetter ) {
				worseContrast = ( worseContrast + target ) / 2;
			}
			replacedBetter = true;
			replacedWorse = false;
		} else {
			worseL = newL;
			worseContrast = bestContrast;
			if ( replacedWorse ) {
				betterContrast = ( betterContrast + target ) / 2;
			}
			replacedWorse = true;
			replacedBetter = false;
		}
	}

	return {
		color: bestColor,
		reached: true,
		achieved: bestContrast,
	};
}
