/**
 * Internal dependencies
 */
import type { Source, Target, Rule } from '../types';
import { stringifyRule } from '../helpers';

/**
 * Evaluates a rule with the 'less than' operator.
 *
 * @param {Source}  source The source value.
 * @param {Target}  target The target value.
 * @param {Rule}    rule   The rule to evaluate.
 * @param {boolean} strict Whether to use strict comparison.
 * @return {boolean} The result of the evaluation.
 */
export function evaluateNumericCompare(
	source: Source,
	target: Target,
	rule: Rule,
	strict: boolean = true
): boolean {
	if ( typeof source !== 'number' || typeof target !== 'number' ) {
		throw new TypeError(
			`Rule ${ stringifyRule(
				rule
			) } source and target must be numbers for operator '${ rule[ 1 ] }'`
		);
	}

	if ( strict ) {
		return source < target;
	}

	return source <= target;
}
