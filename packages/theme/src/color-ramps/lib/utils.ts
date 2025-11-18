/**
 * External dependencies
 */
import { type ColorTypes } from 'colorjs.io/fn';

/**
 * Internal dependencies
 */
import './register-color-spaces';
import {
	WHITE,
	BLACK,
	UNIVERSAL_CONTRAST_TOPUP,
	WHITE_TEXT_CONTRAST_MARGIN,
	ACCENT_SCALE_BASE_LIGHTNESS_THRESHOLDS,
	MAX_BISECTION_ITERATIONS,
	CONTRAST_EPSILON,
} from './constants';
import type { Ramp, RampConfig, RampDirection } from './types';
import { getContrast } from './color-utils';

/**
 * Build a dependency graph from the steps configuration
 * @param config - The steps configuration object
 */
function buildDependencyGraph( config: RampConfig ): {
	dependencies: Map< keyof Ramp, ( keyof Ramp | 'seed' )[] >;
	dependents: Map< keyof Ramp | 'seed', ( keyof Ramp )[] >;
} {
	const dependencies = new Map< keyof Ramp, ( keyof Ramp | 'seed' )[] >();
	const dependents = new Map< keyof Ramp | 'seed', ( keyof Ramp )[] >();

	// Initialize maps
	Object.keys( config ).forEach( ( step ) => {
		dependencies.set( step as keyof Ramp, [] );
	} );
	dependents.set( 'seed', [] );
	Object.keys( config ).forEach( ( step ) => {
		dependents.set( step as keyof Ramp, [] );
	} );

	// Build the graph
	Object.entries( config ).forEach( ( [ stepName, stepConfig ] ) => {
		const step = stepName as keyof Ramp;
		const reference = stepConfig.contrast.reference;

		dependencies.get( step )!.push( reference );
		dependents.get( reference )!.push( step );

		// Add dependency for sameAsIfPossible
		if ( stepConfig.sameAsIfPossible ) {
			dependencies.get( step )!.push( stepConfig.sameAsIfPossible );
			dependents.get( stepConfig.sameAsIfPossible )!.push( step );
		}
	} );

	return { dependencies, dependents };
}

/**
 * Topologically sort steps based on their dependencies
 * @param config - The steps configuration object
 */
export function sortByDependency( config: RampConfig ): ( keyof Ramp )[] {
	const { dependents } = buildDependencyGraph( config );
	const result: ( keyof Ramp )[] = [];
	const visited = new Set< keyof Ramp | 'seed' >();
	const visiting = new Set< keyof Ramp | 'seed' >();

	function visit( node: keyof Ramp | 'seed' ): void {
		if ( visiting.has( node ) ) {
			throw new Error(
				`Circular dependency detected involving step: ${ String(
					node
				) }`
			);
		}
		if ( visited.has( node ) ) {
			return;
		}

		visiting.add( node );

		// Visit all dependents (steps that depend on this node)
		const nodeDependents = dependents.get( node ) || [];
		nodeDependents.forEach( ( dependent ) => {
			visit( dependent );
		} );

		visiting.delete( node );
		visited.add( node );

		// Add to result only if it's a step (not 'seed')
		if ( node !== 'seed' ) {
			result.unshift( node ); // Add to front for correct topological order
		}
	}

	// Start with seed - this will recursively visit all reachable nodes
	visit( 'seed' );

	return result;
}
/**
 * Return minimal set of steps that are needed to calculate `stepName` from the seed.
 * @param stepName Name of the step.
 * @param config   Configuration of the ramp.
 * @return Array of steps that `stepName` depends on.
 */
export function stepsForStep(
	stepName: keyof Ramp,
	config: RampConfig
): ( keyof Ramp )[] {
	const result = new Set< keyof Ramp >();
	function visit( step: keyof Ramp | 'seed' ) {
		if ( step === 'seed' || result.has( step ) ) {
			return;
		}

		const stepConfig = config[ step ];
		if ( ! stepConfig ) {
			return;
		}

		visit( stepConfig.contrast.reference );
		if ( stepConfig.sameAsIfPossible ) {
			visit( stepConfig.sameAsIfPossible );
		}

		result.add( step );
	}
	visit( stepName );
	return Array.from( result );
}

/**
 * Finds out whether a lighter or a darker foreground color achieves a better
 * contrast against the seed
 * @param seed
 * @param preferLighter Whether the check should favor white foreground color
 * @return An object with "better" and "worse" properties, each holding a
 * ramp direction value.
 */
export function computeBetterFgColorDirection(
	seed: ColorTypes,
	preferLighter?: boolean
): {
	better: RampDirection;
	worse: RampDirection;
} {
	const contrastAgainstBlack = getContrast( seed, BLACK );
	const contrastAgainstWhite = getContrast( seed, WHITE );

	return contrastAgainstBlack >
		contrastAgainstWhite +
			( preferLighter ? WHITE_TEXT_CONTRAST_MARGIN : 0 )
		? { better: 'darker', worse: 'lighter' }
		: { better: 'lighter', worse: 'darker' };
}

export function adjustContrastTarget( target: number ) {
	if ( target === 1 ) {
		return 1;
	}

	// Add a little top up to take into account any rounding error and algo imprecisions.
	return target + UNIVERSAL_CONTRAST_TOPUP;
}

/**
 * Prevent the accent scale from referencing a lightness value that
 * would prevent the algorithm from complying with the requirements
 * and cause it to generate unexpected results.
 * @param rawLightness
 * @param direction
 * @return The clamped lightness value
 */
export function clampAccentScaleReferenceLightness(
	rawLightness: number,
	direction: RampDirection
) {
	const thresholds = ACCENT_SCALE_BASE_LIGHTNESS_THRESHOLDS[ direction ];
	return Math.max( thresholds.min, Math.min( thresholds.max, rawLightness ) );
}

/**
 * Find the value of of `L` (luminance) that produces a `C` (color) that has a
 * `value` (contrast delta) equal to zero.
 * @param calculateC     Calculate `C` from a given `L`.
 * @param calculateValue Calculate value (delta) for a given `C`.
 * @param initLowerL     Initial lower value of `L`.
 * @param initLowerValue Initial lower delta (negative).
 * @param initUpperL     Initial upper value of `L`.
 * @param initUpperValue Initial upper delta (positive).
 * @return Resulting value of type `C`.
 */
export function solveWithBisect< C >(
	calculateC: ( l: number ) => C,
	calculateValue: ( t: C ) => number,
	initLowerL: number,
	initLowerValue: number,
	initUpperL: number,
	initUpperValue: number
): C {
	let lowerL = initLowerL;
	let lowerValue = initLowerValue;
	let lowerReplaced = false;

	let upperL = initUpperL;
	let upperValue = initUpperValue;
	let upperReplaced = false;

	let bestC: C;
	let bestValue: number;
	let iterations = 0;

	while ( true ) {
		iterations++;

		// Linear interpolation: find the point where a line would cross the zero axis.
		const newL =
			( lowerL * upperValue - upperL * lowerValue ) /
			( upperValue - lowerValue );

		bestC = calculateC( newL );
		bestValue = calculateValue( bestC );

		if (
			Math.abs( bestValue ) <= CONTRAST_EPSILON ||
			iterations >= MAX_BISECTION_ITERATIONS
		) {
			break;
		}

		// Update the lower/upper bracket values. When only one side is repeatedly updated,
		// apply so-called "Illinois trick" for faster convergence: halve the opposite value.
		if ( bestValue <= 0 ) {
			lowerL = newL;
			lowerValue = bestValue;
			if ( lowerReplaced ) {
				upperValue /= 2;
			}
			lowerReplaced = true;
			upperReplaced = false;
		} else {
			upperL = newL;
			upperValue = bestValue;
			if ( upperReplaced ) {
				lowerValue /= 2;
			}
			upperReplaced = true;
			lowerReplaced = false;
		}
	}

	return bestC;
}
