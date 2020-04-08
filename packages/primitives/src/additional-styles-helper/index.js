/**
 * External dependencies
 */
import { css } from '@emotion/core';

const allowedStates = [
	'focus',
	'active',
	'enabled',
	'hover',
	'disabled',
	'visited',
];

/**
 * Generates the `css` template string from additionalStyles.
 *
 * @param {Array} additionalStyles - Array with record styles for a particular state.
 * [{
 *		states: 'hover:focus:enabled',
 *		styles: {
 *			color: 'red'
 * 		},
 * }]
 * @return {string} - template string to use as a `css` prop.
 */
export const additionalStylesHelper = ( additionalStyles = [] ) => {
	let styles = ``;
	additionalStyles.forEach( ( record ) => {
		if ( record.states === '' ) {
			styles += `${ stringStylesFromObjectStyles( record.styles ) }`;
		}
		if ( isValidState( record.states ) ) {
			styles += `
&:${ record.states } {${ stringStylesFromObjectStyles( record.styles ) }
}
			`;
		}
	} );
	if ( styles.length > 0 ) {
		return css`
			${styles}
		`;
	}
	return undefined;
};

/**
 * Checks if the state name is valid.
 *
 * @param {string} statesString - String with states name i.e 'hove:focus:active'
 * @return {boolean} - true if the state name is valid
 */
const isValidState = ( statesString ) => {
	const splitStates = statesString.split( ':' );
	for ( let i = 0; i < splitStates.length; i++ ) {
		if ( ! allowedStates.includes( splitStates[ i ] ) ) {
			return false;
		}
	}
	return true;
};

/**
 * Generates string styles from object with styles.
 *
 * @param {Object} objectStyles - Object with styles.
 * @return {string} - string with styles that are generated from passed object.
 */
const stringStylesFromObjectStyles = ( objectStyles ) => {
	let styles = '';
	Object.entries( objectStyles ).forEach( ( [ key, value ] ) => {
		styles += `
  ${ key }: ${ value };`;
	} );
	return styles;
};
