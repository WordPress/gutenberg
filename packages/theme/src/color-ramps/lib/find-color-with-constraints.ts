/**
 * External dependencies
 */
import Color from 'colorjs.io';

/**
 * Internal dependencies
 */
import { clampToGamut } from './utils';
import {
	WHITE,
	BLACK,
	LIGHTNESS_EPSILON,
	MAX_BISECTION_ITERATIONS,
} from './constants';
import { getCachedContrast } from './cache-utils';
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
	reference: Color,
	seed: Color,
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
): { color: Color; reached: boolean; achieved: number } {
	// A target of 1 means same color.
	// A target lower than 1 doesn't make sense.
	if ( target <= 1 ) {
		return { color: seed.clone(), reached: true, achieved: 1 };
	}

	if ( lightnessConstraint ) {
		// Apply a specific L value.
		// Useful when pinning a step to a specific lightness, of to specify
		// min/max L values.
		let newL = lightnessConstraint.value;
		let newC = seed.oklch.c;

		if ( taperChromaOptions ) {
			( { l: newL, c: newC } = taperChroma(
				seed,
				newL,
				taperChromaOptions
			) );
		}

		const colorWithExactL = clampToGamut(
			new Color( 'oklch', [ newL, newC, seed.oklch.h ] )
		);
		const exactLContrast = getCachedContrast( reference, colorWithExactL );

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
	const highestPossibleContrast = getCachedContrast(
		reference,
		mostContrastingColor
	);

	// If even the most contrasting color can't reach the target,
	// the target is unreachable.
	if ( highestPossibleContrast < target ) {
		if ( strict ) {
			throw new Error(
				`Contrast target ${ target.toFixed(
					2
				) }:1 unreachable in ${ direction } direction against ${ mostContrastingColor.toString() }` +
					`(boundary achieves ${ highestPossibleContrast.toFixed(
						3
					) }:1).`
			);
		}

		return {
			color: mostContrastingColor,
			reached: false,
			achieved: highestPossibleContrast,
		};
	}

	// Bracket: low fails, high meets.
	// Originally this was seed.oklch.l — although it's an assumption that works
	// only when we know for sure the direction of the search.
	// TODO: can we bring this back to seed.oklch.l ?
	let worseL = reference.oklch.l;
	let betterL = mostContrastingL;

	let bestContrastFound = highestPossibleContrast;
	let resultingColor = mostContrastingColor;

	for (
		let i = 0;
		i < MAX_BISECTION_ITERATIONS &&
		Math.abs( betterL - worseL ) > LIGHTNESS_EPSILON;
		i++
	) {
		let newL = ( worseL + betterL ) / 2;
		let newC = seed.oklch.c;

		if ( taperChromaOptions ) {
			( { l: newL, c: newC } = taperChroma(
				seed,
				newL,
				taperChromaOptions
			) );
		}

		const newColor = clampToGamut(
			new Color( 'oklch', [ newL, newC, seed.oklch.h ] )
		);
		const newContrast = getCachedContrast( reference, newColor );

		if ( newContrast >= target ) {
			betterL = newL;
			// Only update the resulting color when the target is met, this ensuring
			// at the end of the search the target is always met.
			bestContrastFound = newContrast;
			resultingColor = newColor;
		} else {
			worseL = newL;
		}
	}

	return {
		color: resultingColor,
		reached: true,
		achieved: bestContrastFound,
	};
}
