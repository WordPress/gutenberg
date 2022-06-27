/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * Internal dependencies
 */
import type {
	CssRulesKeys,
	GeneratedCSSRule,
	Style,
	Box,
	StyleOptions,
} from '../types';
import {
	VARIABLE_REFERENCE_PREFIX,
	VARIABLE_PATH_SEPARATOR_TOKEN_ATTRIBUTE,
	VARIABLE_PATH_SEPARATOR_TOKEN_STYLE,
} from './constants';

/**
 * Returns a JSON representation of the generated CSS rules.
 *
 * @param  style   Style object.
 * @param  options Options object with settings to adjust how the styles are generated.
 * @param  path    An array of strings representing the path to the style value in the style object.
 * @param  ruleKey A CSS property key.
 *
 * @return GeneratedCSSRule[] CSS rules.
 */
export function generateRule(
	style: Style,
	options: StyleOptions,
	path: string[],
	ruleKey: string
) {
	const styleValue: string | undefined = get( style, path );

	return styleValue
		? [
				{
					selector: options?.selector,
					key: ruleKey,
					value: getCSSVarFromStyleValue( styleValue ),
				},
		  ]
		: [];
}

/**
 * Returns a JSON representation of the generated CSS rules taking into account box model properties, top, right, bottom, left.
 *
 * @param style                Style object.
 * @param options              Options object with settings to adjust how the styles are generated.
 * @param path                 An array of strings representing the path to the style value in the style object.
 * @param ruleKeys             An array of CSS property keys and patterns.
 * @param individualProperties The "sides" or individual properties for which to generate rules.
 *
 * @return GeneratedCSSRule[]  CSS rules.
 */
export function generateBoxRules(
	style: Style,
	options: StyleOptions,
	path: string[],
	ruleKeys: CssRulesKeys,
	individualProperties: string[] = [ 'top', 'right', 'bottom', 'left' ]
): GeneratedCSSRule[] {
	const boxStyle: Box | string | undefined = get( style, path );
	if ( ! boxStyle ) {
		return [];
	}

	const rules: GeneratedCSSRule[] = [];
	if ( typeof boxStyle === 'string' ) {
		rules.push( {
			selector: options?.selector,
			key: ruleKeys.default,
			value: boxStyle,
		} );
	} else {
		const sideRules = individualProperties.reduce(
			( acc: GeneratedCSSRule[], side: string ) => {
				const value: string | undefined = get( boxStyle, [ side ] );
				if ( value ) {
					acc.push( {
						selector: options?.selector,
						key: ruleKeys?.individual.replace(
							'%s',
							upperFirst( side )
						),
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

/**
 * Returns a CSS var value from incoming style value following the pattern `var:description|context|slug`.
 *
 * @param  styleValue A raw style value.
 *
 * @return string A CSS var value.
 */
export function getCSSVarFromStyleValue( styleValue: string ): string {
	if (
		typeof styleValue === 'string' &&
		styleValue.startsWith( VARIABLE_REFERENCE_PREFIX )
	) {
		const variable = styleValue
			.slice( VARIABLE_REFERENCE_PREFIX.length )
			.split( VARIABLE_PATH_SEPARATOR_TOKEN_ATTRIBUTE )
			.join( VARIABLE_PATH_SEPARATOR_TOKEN_STYLE );
		return `var(--wp--${ variable })`;
	}
	return styleValue;
}

/**
 * Capitalizes the first letter in a string.
 *
 * @param {string} str The string whose first letter the function will capitalize.
 *
 * @return string A CSS var value.
 */
export function upperFirst( [ firstLetter, ...rest ]: string ) {
	return firstLetter.toUpperCase() + rest.join( '' );
}
