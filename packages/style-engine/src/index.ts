/**
 * External dependencies
 */
import { groupBy, kebabCase } from 'lodash';

/**
 * Internal dependencies
 */
import type { Style, GeneratedCSSRule, StyleDefinition } from './types';
import { styleDefinitions } from './styles';

/**
 * Generates a stylesheet for a given style object and selector.
 *
 * @param  style    Style object.
 * @param  selector CSS selector.
 *
 * @return generated stylesheet.
 */
export function generate( style: Style, selector: string ): string {
	const rules = getCSSRules( style, selector );
	const groupedRules = groupBy( rules, 'selector' );
	const selectorRules = Object.keys( groupedRules ).reduce(
		( acc: string[], subSelector: string ) => {
			acc.push(
				`${ subSelector } { ${ groupedRules[ subSelector ]
					.map(
						( rule: GeneratedCSSRule ) =>
							`${ kebabCase( rule.key ) }: ${ rule.value };`
					)
					.join( ' ' ) } }`
			);
			return acc;
		},
		[]
	);

	return selectorRules.join( '\n' );
}

/**
 * Returns a JSON representation of the generated CSS rules.
 *
 * @param  style    Style object.
 * @param  selector CSS selector.
 *
 * @return generated styles.
 */
export function getCSSRules(
	style: Style,
	selector: string
): GeneratedCSSRule[] {
	let rules: GeneratedCSSRule[] = [];
	styleDefinitions.forEach( ( definition: StyleDefinition ) => {
		rules = [ ...rules, ...definition.generate( style, selector ) ];
	} );

	return rules;
}
