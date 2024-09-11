/**
 * Internal dependencies
 */
import type { Source, Target, Rule } from '../types';
import { stringifyRule } from '../helpers';

/**
 * Evaluates a rule with the 'less than' operator.
 *
 * @param {Source}  source    The source value.
 * @param {Target}  target    The target value.
 * @param {Rule}    rule      The rule to evaluate.
 * @param {boolean} inclusive Whether to use inclusive comparison.
 * @return {boolean} The result of the evaluation.
 */
export function evaluateNumericCompare(
	source: Source,
	target: Target,
	rule: Rule,
	inclusive: boolean = false
): boolean {
	if ( typeof source === 'string' ) {
		source = parseFloat( source );
	}

	if ( typeof target === 'string' ) {
		target = parseFloat( target );
	}

	if ( typeof source !== 'number' || typeof target !== 'number' ) {
		throw new TypeError(
			`Rule ${ stringifyRule(
				rule
			) } source and target must be numbers for operator '${ rule[ 1 ] }'`
		);
	}

	if ( inclusive ) {
		return source <= target;
	}

	return source < target;
}
