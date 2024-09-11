/**
 * Internal dependencies
 */
import type {
	EvaluatorFunction,
	Source,
	Target,
	Rule,
	Operator,
} from '../types';
import { evaluateIs } from './equation';
import { evaluateInclusion } from './inclusion';
import { evaluateNumericCompare } from './numeric-compare';

function createRegistry() {
	const functions: Map< Operator, EvaluatorFunction > = new Map();

	const aliases: Record< string, Operator > = {};
	function register( key: Operator, func: EvaluatorFunction ): void {
		functions.set( key, func );
	}

	function alias( aliasKey: string, existingKey: Operator ): void {
		aliases[ aliasKey ] = existingKey;
	}

	function call(
		key: string,
		...args: Parameters< EvaluatorFunction >
	): ReturnType< EvaluatorFunction > {
		let func = functions.get( key );
		if ( ! func ) {
			const aliasedKey = aliases[ key ];
			if ( aliasedKey ) {
				func = functions.get( aliasedKey );
			}
			if ( ! func ) {
				throw new Error(
					`No such evaluator with key "${ key }" exists.`
				);
			}
		}
		return func( ...args );
	}

	function has( key: Operator ): boolean {
		return functions.has( key );
	}

	function getOperators(): Operator[] {
		return Array.from( functions.keys() );
	}

	return { register, call, has, alias, getOperators };
}

const registry = createRegistry();

registry.register( 'is', evaluateIs );
registry.alias( '=', 'is' );
registry.register(
	'not is',
	( ...args: Parameters< typeof evaluateIs > ) => ! evaluateIs( ...args )
);
registry.alias( '!=', 'not is' );
registry.register( 'in', evaluateInclusion );

registry.register(
	'not in',
	( ...args: Parameters< typeof evaluateInclusion > ) =>
		! evaluateInclusion( ...args )
);
registry.alias( '!in', 'in' );
registry.register( 'contains', ( source: Source, target: Target, rule: Rule ) =>
	// We need to reverse the source and target for the contains operator.
	evaluateInclusion( target, source, rule )
);
registry.register(
	'not contains',
	( source: Source, target: Target, rule: Rule ) =>
		// We need to reverse the source and target for the not contains operator.
		! evaluateInclusion( target, source, rule )
);
registry.alias( '!contains', 'contains' );
registry.register( 'less than', evaluateNumericCompare );
registry.alias( '<', 'less than' );
registry.register(
	'greater than',
	( source: Source, target: Target, rule: Rule ) =>
		// We need to reverse the source and target for the greater than operator.
		evaluateNumericCompare( target, source, rule )
);
registry.alias( '>', 'greater than' );
registry.register( 'lte', ( source: Source, target: Target, rule: Rule ) =>
	evaluateNumericCompare( source, target, rule, true )
);
registry.alias( '<=', 'lte' );
registry.register( 'gte', ( source: Source, target: Target, rule: Rule ) =>
	// We need to reverse the source and target for the greater than operator.
	evaluateNumericCompare( target, source, rule, true )
);
registry.alias( '>=', 'gte' );
export { registry };
