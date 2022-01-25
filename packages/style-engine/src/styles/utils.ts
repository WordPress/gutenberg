/**
 * External dependencies
 */
import { get, upperFirst } from 'lodash';

/**
 * Internal dependencies
 */
import type { GeneratedCSSRule, Style, Box } from '../types';

export function generateBoxRules(
	style: Style,
	selector: string,
	path: string[],
	ruleKey: string
): GeneratedCSSRule[] {
	const boxStyle: Box | string | undefined = get( style, path );
	if ( ! boxStyle ) {
		return [];
	}

	const rules: GeneratedCSSRule[] = [];
	if ( typeof boxStyle === 'string' ) {
		rules.push( { selector, key: ruleKey, value: boxStyle } );
	} else {
		const sideRules = [ 'top', 'bottom', 'left', 'right' ].reduce(
			( acc: GeneratedCSSRule[], side: string ) => {
				const value: string | undefined = get( boxStyle, [ side ] );
				if ( value ) {
					acc.push( {
						selector,
						key: `${ ruleKey }${ upperFirst( side ) }`,
						value,
					} );
				}
				return acc;
			},
			[]
		);
		rules.push( ...sideRules );
	}

	return rules;
}
