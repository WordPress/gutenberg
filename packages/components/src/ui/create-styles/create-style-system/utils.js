/**
 * External dependencies
 */
import hash from '@emotion/hash';
import { kebabCase } from 'lodash';

/**
 * Internal dependencies
 */
import { INTERPOLATION_CLASS_NAME, NAMESPACE } from './constants';

/**
 * @type {{
	baseStyles: any;
	config: any;
	darkModeConfig: any;
	highContrastModeConfig: any;
	darkHighContrastModeConfig: any;
	compilerOptions: any;
	}}
 */
export const DEFAULT_STYLE_SYSTEM_OPTIONS = {
	baseStyles: {},
	config: {},
	darkModeConfig: {},
	highContrastModeConfig: {},
	darkHighContrastModeConfig: {},
	compilerOptions: undefined,
};

/**
 * Creates the (CSS Variable) design token used by the Style system.
 *
 * @param {string} key The variable (key).
 * @return {string} The token (CSS variable).
 */
export function createToken( key ) {
	return `${ NAMESPACE }-${ kebabCase( key ) }`;
}

/**
 * The primary mechanism to retrieve Style system configs values - values that
 * have been transformed into CSS variables with a dedicated namespace.
 *
 * @example
 * ```js
 * get('colorAdmin'); // var(--wp-color-admin, 'blue');
 * ```
 * @template {Record<string, string | number>} TConfig
 * @template {Record<string, string | number>} TDarkConfig
 * @template {Record<string, string | number>} THCConfig
 * @template {Record<string, string | number>} TDarkHCConfig
 * @template {string} TGeneratedTokens
 * @param {keyof (TConfig & TDarkConfig & THCConfig & TDarkHCConfig) | TGeneratedTokens} key The config variable to retrieve.
 * @return {string} The compiled CSS variable associated with the config key.
 */
export function get( key ) {
	return `var(${ createToken( key.toString() ) })`;
}

/** @typedef {Record<string, string | number>} StyleConfigValues */
/** @typedef {Record<string, string>} StyleConfig */

/**
 * Transforms a series of config values into set of namespaced CSS
 * references for the Style system.
 *
 * @param {StyleConfigValues} values Style config values to transform into CSS variables.
 * @return {StyleConfig} The set of CSS variables, transformed from config values.
 */
export function transformValuesToReferences( values = {} ) {
	/** @type {StyleConfig} */
	const next = {};
	for ( const [ key, value ] of Object.entries( values ) ) {
		const ref = `var(${ createToken( key ) }, ${ value })`;
		next[ key ] = ref;
	}
	return next;
}

/**
 * Transforms a series of config values into set of namespaced CSS
 * variables for the Style system. These values can then be safely and predictable
 * retrieved using the get() function.
 *
 * @param {StyleConfigValues} values Style config values to transform into CSS variables.
 * @return {StyleConfig} The set of CSS variables, transformed from config values.
 */
export function transformValuesToVariables( values = {} ) {
	/** @type {StyleConfig} */
	const next = {};

	for ( const [ key, value ] of Object.entries( values ) ) {
		const ref = value;
		next[ `${ createToken( key ) }` ] = ref?.toString();
	}

	return next;
}

/**
 * Transforms a series of config values into set of namespaced CSS
 * references for the Style system. These values are then transformed into
 * a CSS style value (`string`) that can be injected into the DOM, within a
 * <style> tag.
 *
 * @param {string} [selector=':root'] The selector to attach the config values to.
 * @param {StyleConfigValues} values Style config values to transform into CSS variables.
 * @param {boolean} isGlobal
 * @return {string} Compiled innerHTML styles to be injected into a <style /> tag.
 */
export function transformValuesToVariablesString(
	selector = ':root',
	values = {},
	isGlobal = true
) {
	const variables = transformValuesToVariables( values );

	const next = [];
	let needsTerminator = false;

	if ( isGlobal ) {
		next.push( `${ selector } {` );
		needsTerminator = true;
	} else if ( selector !== ':root' ) {
		next.push( `&${ selector } {` );
		needsTerminator = true;
	}

	for ( const [ key, value ] of Object.entries( variables ) ) {
		const ref = value;
		if ( typeof ref !== 'undefined' && typeof ref !== 'boolean' ) {
			next.push( `${ key }: ${ ref };` );
		}
	}

	if ( needsTerminator ) {
		next.push( '}' );
	}

	return next.join( '' );
}

/* eslint-disable jsdoc/valid-types */
/**
 * @param {any} value
 * @return {value is import('../create-style-system/polymorphic-component').PolymorphicComponent<any, any>} Whether the component is a PolymorphicComponent.
 */
function isPolymorphicComponent( value ) {
	return value && typeof value[ INTERPOLATION_CLASS_NAME ] !== 'undefined';
}
/* eslint-enable jsdoc/valid-types */

/**
 * Resolves and compiles interpolated CSS styles for styled-components.
 * Allows for prop (function) interpolation within the style rules.
 *
 * For more information on tagged template literals, check out:
 * https://mxstbr.blog/2016/11/styled-components-magic-explained/
 *
 * @template TProps
 * @param {(string | ((props: TProps) => string) | import('../create-style-system/polymorphic-component').PolymorphicComponent<any, any>)[]} interpolatedStyles The interpolated styles from a Styled component.
 * @param {TProps} props Incoming component props.
 * @return {string[]} Compiled CSS style rules.
 */
export function compileInterpolatedStyles( interpolatedStyles, props ) {
	const compiledStyles = interpolatedStyles.map( ( a ) => {
		if ( isPolymorphicComponent( a ) ) {
			return `.${ a[ INTERPOLATION_CLASS_NAME ] }`;
		}
		return typeof a === 'function' ? a( props ) : a;
	} );

	return compiledStyles;
}

/**
 * Creates an interpolated className. This is used when styled components are
 * interpolated in the template literal.
 *
 * @param {string} displayName The displayName of the component.
 * @return {string} The interpolated className.
 */
export function getInterpolatedClassName( displayName ) {
	return typeof displayName === 'string' ? `ic-${ hash( displayName ) }` : '';
}
