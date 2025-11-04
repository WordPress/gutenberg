/**
 * External dependencies
 */
// Disable reason: ESLint resolver can't handle `exports`. Import resolver
// checking is redundant in TypeScript files.
// eslint-disable-next-line import/no-unresolved
import { toGamut, to, P3, OKLCH, type ColorTypes } from 'colorjs.io/fn';

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
} from './constants';
import type { Ramp, RampStepConfig, RampDirection } from './types';
import { getContrast } from './color-utils';

/**
 * Make sure that a color is valid in the p3 gamut, and converts it to oklch.
 * @param c
 */
export const clampToGamut = ( c: ColorTypes ) =>
	to( toGamut( c, { space: P3, method: 'css' } ), OKLCH ); // map into Display-P3 using CSS OKLCH method

/**
 * Build a dependency graph from the steps configuration
 * @param config - The steps configuration object
 */
function buildDependencyGraph( config: Record< keyof Ramp, RampStepConfig > ): {
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
export function sortByDependency(
	config: Record< keyof Ramp, RampStepConfig >
): ( keyof Ramp )[] {
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
