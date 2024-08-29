/**
 * Internal dependencies
 */
import type { Source, Target, Rule } from '../types';
import { valueType, stringifyRule } from '../helpers';

/**
 * Evaluates a rule with the 'in' operator.
 *
 * @param {Source} source The source value.
 * @param {Target} target The target value.
 * @param {Rule}   rule   The rule to evaluate.
 * @return {boolean} The result of the evaluation.
 */
export function evaluateInclusion(
	source: Source,
	target: Target,
	rule: Rule
): boolean {
	if ( valueType( source ) !== valueType( target ) ) {
		throw new TypeError(
			`Rule ${ stringifyRule(
				rule
			) } source and target must be the same type for operator '${
				rule[ 1 ]
			}'`
		);
	}

	// IN operator only supports a string target if the source is also a string.
	if ( ! Array.isArray( target ) ) {
		if ( typeof target === 'string' && typeof source === 'string' ) {
			return target.includes( source );
		}
		throw new TypeError(
			`Rule ${ stringifyRule(
				rule
			) } target must be an array for operator '${
				rule[ 1 ]
			}' or both need to be a string`
		);
	}

	if ( Array.isArray( source ) ) {
		return source.every( ( item ) => target.includes( item ) );
	}

	// Includes kept returning a TS error.
	return target.includes( source );
}
