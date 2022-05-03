/**
 * External dependencies
 */
import { get, kebabCase, upperFirst } from 'lodash';

/**
 * Internal dependencies
 */
import type { GeneratedCSSRule, Style, Box, StyleOptions } from '../types';

export function generateRule(
	style: Style,
	path: string[],
	cssProperty: string,
	options: StyleOptions
) {
	const styleValue: string | undefined = get( style, path );

	return styleValue
		? [
				{
					selector: options?.selector,
					key: cssProperty,
					value: styleValue,
				},
		  ]
		: [];
}

export function generateBoxRules(
	style: Style,
	options: StyleOptions,
	path: string[],
	ruleKey: string
): GeneratedCSSRule[] {
	const boxStyle: Box | string | undefined = get( style, path );
	if ( ! boxStyle ) {
		return [];
	}

	const rules: GeneratedCSSRule[] = [];
	if ( typeof boxStyle === 'string' ) {
		rules.push( {
			selector: options?.selector,
			key: ruleKey,
			value: boxStyle,
		} );
	} else {
		const sideRules = [ 'top', 'right', 'bottom', 'left' ].reduce(
			( acc: GeneratedCSSRule[], side: string ) => {
				const value: string | undefined = get( boxStyle, [ side ] );
				if ( value ) {
					acc.push( {
						selector: options?.selector,
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

export function getSlugFromPreset(
	styleValue: string,
	styleContext: string
): string | null {
	if ( ! styleValue ) {
		return null;
	}

	const presetValues = styleValue.split( `var:preset|${ styleContext }|` );

	return presetValues[ 1 ] ? kebabCase( presetValues[ 1 ] ) : null;
}
