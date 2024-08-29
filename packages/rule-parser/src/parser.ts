/**
 * Internal dependencies
 */
import type { Rules, RawRule, Rule, Store } from './types';
import { isStructuredRule, isRule, isRawRule } from './helpers';
import { registry } from './evaluators';

function replaceSources(
	rules: Rules< RawRule >,
	store: Store
): Rules< Rule > {
	if ( isStructuredRule< RawRule >( rules ) ) {
		const [ combinator, subRules ] = rules;
		return [
			combinator,
			subRules.map( ( rule ) => {
				if ( isRawRule( rule ) ) {
					const [ source, operator, target ] = rule;
					const resolvedSource = store[ source ];
					return [ resolvedSource, operator, target ] as Rule;
				}
				return replaceSources( rule, store );
			} ),
		];
	}

	return rules.map( ( rule ) => {
		if ( isRawRule( rule ) ) {
			const [ source, operator, target ] = rule;
			const resolvedSource = store[ source ];
			return [ resolvedSource, operator, target ] as Rule;
		}
		return replaceSources( rule, store );
	} );
}

function evaluateRule( rule: Rule ): boolean {
	const [ source, operator, target ] = rule;

	return registry.call( operator, source, target, rule );
}

function transformRules( rules: Rules< Rule > ): Rules< boolean > {
	if ( isStructuredRule< Rule >( rules ) ) {
		const [ combinator, subRules ] = rules;
		return [
			combinator,
			subRules.map( ( rule ) => {
				if ( isRule( rule ) ) {
					return evaluateRule( rule );
				}
				return transformRules( rule );
			} ),
		];
	}
	return rules.map( ( rule ) => {
		if ( isRule( rule ) ) {
			return evaluateRule( rule );
		}
		return transformRules( rule );
	} );
}

function reduceRules( rules: Rules< boolean > ): boolean {
	if ( isStructuredRule< boolean >( rules ) ) {
		const [ combinator, subRules ] = rules;
		if ( combinator === 'ALL' ) {
			return subRules.every( ( rule ) => {
				if ( Array.isArray( rule ) ) {
					return reduceRules( rule );
				}
				return rule;
			} );
		}
		return subRules.some( ( rule ) => {
			if ( Array.isArray( rule ) ) {
				return reduceRules( rule );
			}
			return rule;
		} );
	}
	return rules.every( ( rule ) => {
		if ( Array.isArray( rule ) ) {
			return reduceRules( rule );
		}
		return rule;
	} );
}

export function parser( rules: Rules< RawRule >, store: Store ): boolean {
	const structuredRules = replaceSources( rules, store );
	const transformedRules = transformRules( structuredRules );
	return reduceRules( transformedRules );
}
