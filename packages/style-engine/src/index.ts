/**
 * External dependencies
 */
import { groupBy, kebabCase } from 'lodash';

/**
 * Internal dependencies
 */
import type {
	Style,
	StyleOptions,
	GeneratedCSSRule,
	StyleDefinition,
} from './types';
import { styleDefinitions } from './styles';

/**
 * Generates a stylesheet for a given style object and selector.
 *
 * @param  style   Style object.
 * @param  options Options object with settings to adjust how the styles are generated.
 *
 * @return generated stylesheet.
 */
export function generate( style: Style, options: StyleOptions ): string {
	const rules = getCSSRules( style, options );

	// If no selector is provided, treat generated rules as inline styles to be returned as a single string.
	if ( ! options?.selector ) {
		const inlineRules: string[] = [];
		rules.forEach( ( rule ) => {
			inlineRules.push( `${ kebabCase( rule.key ) }: ${ rule.value };` );
		} );
		return inlineRules.join( ' ' );
	}

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
 * @param  style   Style object.
 * @param  options Options object with settings to adjust how the styles are generated.
 *
 * @return generated styles.
 */
export function getCSSRules(
	style: Style,
	options: StyleOptions
): GeneratedCSSRule[] {
	const rules: GeneratedCSSRule[] = [];
	styleDefinitions.forEach( ( definition: StyleDefinition ) => {
		if ( typeof definition.generate === 'function' ) {
			rules.push( ...definition.generate( style, options ) );
		}
	} );

	return rules;
}
