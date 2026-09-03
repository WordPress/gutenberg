import { type PlainColorObject } from 'colorjs.io/fn';
import {
	WHITE,
	BLACK,
	UNIVERSAL_CONTRAST_TOPUP,
	WHITE_TEXT_CONTRAST_MARGIN,
	ACCENT_SCALE_BASE_LIGHTNESS_THRESHOLDS,
	MAX_BISECTION_ITERATIONS,
	CONTRAST_EPSILON,
} from './constants.ts';
import type { BaseRampStep, RampStepsConfig, RampDirection } from './types.ts';
import { getContrast } from './color-utils.ts';

/**
 * Track contrast and reuse dependencies between base steps.
 *
 * @param config Base step configuration.
 */
function buildDependencyGraph( config: RampStepsConfig ): {
	dependencies: Map< BaseRampStep, ( BaseRampStep | 'seed' )[] >;
	dependents: Map< BaseRampStep | 'seed', BaseRampStep[] >;
} {
	const dependencies = new Map< BaseRampStep, ( BaseRampStep | 'seed' )[] >();
	const dependents = new Map< BaseRampStep | 'seed', BaseRampStep[] >();

	Object.keys( config ).forEach( ( step ) => {
		dependencies.set( step as BaseRampStep, [] );
	} );
	dependents.set( 'seed', [] );
	Object.keys( config ).forEach( ( step ) => {
		dependents.set( step as BaseRampStep, [] );
	} );

	Object.entries( config ).forEach( ( [ stepName, stepConfig ] ) => {
		const step = stepName as BaseRampStep;
		const references = [
			stepConfig.contrast.reference,
			...( stepConfig.contrast.additionalReferences ?? [] ),
		];

		for ( const reference of references ) {
			dependencies.get( step )!.push( reference );
			dependents.get( reference )!.push( step );
		}

		if ( stepConfig.sameAsIfPossible ) {
			dependencies.get( step )!.push( stepConfig.sameAsIfPossible );
			dependents.get( stepConfig.sameAsIfPossible )!.push( step );
		}
	} );

	return { dependencies, dependents };
}

/**
 * Order base steps so their references are built first. Reject cycles.
 *
 * @param config Base step configuration.
 */
export function sortByDependency( config: RampStepsConfig ): BaseRampStep[] {
	const { dependents } = buildDependencyGraph( config );
	const result: BaseRampStep[] = [];
	const visited = new Set< BaseRampStep | 'seed' >();
	const visiting = new Set< BaseRampStep | 'seed' >();

	function visit( node: BaseRampStep | 'seed' ): void {
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
 * Return the requested step and its dependencies, in build order.
 *
 * @param stepName Name of the step.
 * @param config   Configuration of the ramp.
 */
export function stepsForStep(
	stepName: BaseRampStep,
	config: RampStepsConfig
): BaseRampStep[] {
	const result = new Set< BaseRampStep >();
	function visit( step: BaseRampStep | 'seed' ) {
		if ( step === 'seed' || result.has( step ) ) {
			return;
		}

		const stepConfig = config[ step ];
		if ( ! stepConfig ) {
			return;
		}

		visit( stepConfig.contrast.reference );
		stepConfig.contrast.additionalReferences?.forEach( visit );
		if ( stepConfig.sameAsIfPossible ) {
			visit( stepConfig.sameAsIfPossible );
		}

		result.add( step );
	}
	visit( stepName );
	return Array.from( result );
}

/**
 * Choose black or white by its weakest WCAG contrast across the references.
 * This selects a direction; it does not prove a contrast target is reachable.
 *
 * @param references    Colors the foreground must contrast against.
 * @param preferLighter Bias the comparison toward white.
 */
export function computeBetterFgColorDirection(
	references: string | PlainColorObject | readonly PlainColorObject[],
	preferLighter?: boolean
): {
	better: RampDirection;
	worse: RampDirection;
} {
	const referenceColors = Array.isArray( references )
		? references
		: [ references ];
	const contrastAgainstBlack = Math.min(
		...referenceColors.map( ( reference ) =>
			getContrast( reference, BLACK )
		)
	);
	const contrastAgainstWhite = Math.min(
		...referenceColors.map( ( reference ) =>
			getContrast( reference, WHITE )
		)
	);

	return contrastAgainstBlack >
		contrastAgainstWhite +
			( preferLighter ? WHITE_TEXT_CONTRAST_MARGIN : 0 )
		? { better: 'darker', worse: 'lighter' }
		: { better: 'lighter', worse: 'darker' };
}

/**
 * Pad a WCAG target for rounding, except 1, which means reuse the reference.
 *
 * @param target Unpadded WCAG ratio.
 */
export function adjustContrastTarget( target: number ) {
	if ( target === 1 ) {
		return 1;
	}

	return target + UNIVERSAL_CONTRAST_TOPUP;
}

/**
 * Bound the accent surface anchor to leave room for contrasting foregrounds.
 *
 * @param rawLightness Background SF2 lightness in OKLCH.
 * @param direction    Ramp's foreground direction.
 */
export function clampAccentScaleReferenceLightness(
	rawLightness: number,
	direction: RampDirection
) {
	const thresholds = ACCENT_SCALE_BASE_LIGHTNESS_THRESHOLDS[ direction ];
	return Math.max( thresholds.min, Math.min( thresholds.max, rawLightness ) );
}

/**
 * Search for zero signed error between two bounds. "Lower" and "upper" refer
 * to error signs, not numeric lightness order. Stops at the tolerance or
 * iteration limit; callers must check any strict output requirements.
 *
 * @param calculateC     Build a candidate from the search parameter (usually lightness).
 * @param calculateValue Signed error for a candidate.
 * @param initLowerL     Parameter at the negative-error bound.
 * @param initLowerValue Initial negative error.
 * @param initUpperL     Parameter at the positive-error bound.
 * @param initUpperValue Initial positive error.
 * @return Last sampled candidate.
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
