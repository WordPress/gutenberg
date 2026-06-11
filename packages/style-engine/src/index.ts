/**
 * External dependencies
 */
import { paramCase as kebabCase } from 'change-case';

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
 * A block or theme style object accepted by `compileCSS` and `getCSSRules`.
 */
export type { Style } from './types';

/**
 * Options for `compileCSS` and `getCSSRules`.
 */
export type { StyleOptions } from './types';

/**
 * A single CSS rule produced by `getCSSRules`.
 */
export type { GeneratedCSSRule } from './types';

/**
 * Generates a stylesheet for a given style object and selector.
 *
 * @since 6.1.0 Introduced in WordPress core.
 *
 * @param style   Style object, for example, the value of a block's attributes.style object or the top level styles in theme.json
 * @param options Options object with settings to adjust how the styles are generated.
 *
 * @example
 * ```js
 * import { compileCSS } from '@wordpress/style-engine';
 *
 * // With a selector, a full stylesheet string is returned.
 * compileCSS(
 * 	{ spacing: { padding: '10px', margin: '12px' } },
 * 	{ selector: '.my-block' }
 * );
 * // '.my-block { margin: 12px; padding: 10px; }'
 *
 * // Without a selector, inline declarations are returned.
 * compileCSS( { spacing: { padding: '10px', margin: '12px' } } );
 * // 'margin: 12px; padding: 10px;'
 * ```
 *
 * @return A generated stylesheet or inline style declarations.
 */
export function compileCSS( style: Style, options: StyleOptions = {} ): string {
	const rules = getCSSRules( style, options );

	// If no selector is provided, treat generated rules as inline styles to be returned as a single string.
	if ( ! options?.selector ) {
		const inlineRules: string[] = [];
		rules.forEach( ( rule ) => {
			inlineRules.push( `${ kebabCase( rule.key ) }: ${ rule.value };` );
		} );
		return inlineRules.join( ' ' );
	}

	const groupedRules = rules.reduce(
		( acc: Record< string, GeneratedCSSRule[] >, rule ) => {
			const { selector } = rule;
			if ( ! selector ) {
				return acc;
			}
			if ( ! acc[ selector ] ) {
				acc[ selector ] = [];
			}
			acc[ selector ].push( rule );
			return acc;
		},
		{}
	);
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
 * @since 6.1.0 Introduced in WordPress core.
 *
 * @param style   Style object, for example, the value of a block's attributes.style object or the top level styles in theme.json
 * @param options Options object with settings to adjust how the styles are generated.
 *
 * @example
 * ```js
 * import { getCSSRules } from '@wordpress/style-engine';
 *
 * getCSSRules(
 * 	{ spacing: { padding: '10px', margin: '12px' } },
 * 	{ selector: '.my-block' }
 * );
 * // [
 * //   { selector: '.my-block', key: 'margin', value: '12px' },
 * //   { selector: '.my-block', key: 'padding', value: '10px' },
 * // ]
 * ```
 *
 * @return A collection of objects containing the selector, if any, the CSS property key (camelcase) and parsed CSS value.
 */
export function getCSSRules(
	style: Style,
	options: StyleOptions = {}
): GeneratedCSSRule[] {
	const rules: GeneratedCSSRule[] = [];
	styleDefinitions.forEach( ( definition: StyleDefinition ) => {
		if ( typeof definition.generate === 'function' ) {
			rules.push( ...definition.generate( style, options ) );
		}
	} );

	return rules;
}

// Export style utils.
export { getCSSValueFromRawStyle } from './styles/utils';
