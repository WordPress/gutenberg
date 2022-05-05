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
	const groupedRules = groupBy( rules, 'selector' );
	const selectorRules = Object.keys( groupedRules ).reduce(
		( acc: string[], subSelector: string ) => {
			const hasSelector = subSelector !== 'undefined';
			const prefix = hasSelector ? `${ subSelector } { ` : '';
			const suffix = subSelector !== 'undefined' ? ' }' : '';
			acc.push(
				`${ prefix }${ groupedRules[ subSelector ]
					.map(
						( rule: GeneratedCSSRule ) =>
							`${ kebabCase( rule.key ) }: ${ rule.value };`
					)
					.join( ' ' ) }${ suffix }`
			);
			return acc;
		},
		[]
	);

	return selectorRules.join( '' );
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
		rules.push( ...definition.generate( style, options ) );
	} );

	return rules;
}

/**
 * Returns an array of classnames.
 *
 * @param  style Style object.
 *
 * @return An array of classnames.
 */
export function getClassnames( style: Style ): string[] {
	const classNames: string[] = [];
	styleDefinitions.forEach( ( definition: StyleDefinition ) => {
		if ( typeof definition.getClassNames === 'function' ) {
			classNames.push( ...definition.getClassNames( style ) );
		}
	} );

	return [ ...new Set( classNames ) ];
}
