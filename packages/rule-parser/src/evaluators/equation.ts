/**
 * Internal dependencies
 */
import type { Source, Target, Rule } from '../types';
import { stringifyRule } from '../helpers';

/**
 * Evaluates a rule with the 'is' operator.
 *
 * @param {Source} source The source value.
 * @param {Target} target The target value.
 * @param {Rule}   rule   The rule to evaluate.
 * @return {boolean} The result of the evaluation.
 */
export function evaluateIs(
	source: Source,
	target: Target,
	rule: Rule
): boolean {
	if (
		( Array.isArray( source ) && ! Array.isArray( target ) ) ||
		( ! Array.isArray( source ) && Array.isArray( target ) )
	) {
		throw new TypeError(
			`Rule ${ stringifyRule(
				rule
			) } source and target must be both primitives or arrays for operator '${
				rule[ 1 ]
			}'`
		);
	}

	if ( Array.isArray( source ) && Array.isArray( target ) ) {
		return source.every( ( item ) => target.includes( item ) );
	}

	// Equation supports loose comparison.
	// eslint-disable-next-line eqeqeq
	return source == target;
}
