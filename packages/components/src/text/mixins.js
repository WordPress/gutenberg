/**
 * External dependencies
 */
import { variant } from 'styled-system';

/**
 * @typedef {Object} TextProps
 * @property {TextVariant} variant
 */

/**
 * @param {TextProps} props
 */
export const text = variant( {
	variants: {
		title: {
			large: {
				fontFamily: 0,
				fontWeight: 2,
				fontSize: 5,
				lineHeight: 5,
			},
			medium: {
				fontFamily: 0,
				fontWeight: 2,
				fontSize: 4,
				lineHeight: 4,
			},
			small: {
				fontFamily: 0,
				fontWeight: 2,
				fontSize: 3,
				lineHeight: 3,
			},
		},
		subtitle: {
			large: {
				fontFamily: 0,
				fontWeight: 1,
				fontSize: 2,
				lineHeight: 2,
			},
			small: {
				fontFamily: 0,
				fontWeight: 1,
				fontSize: 1,
				lineHeight: 1,
			},
		},
		body: {
			large: {
				fontFamily: 0,
				fontWeight: 0,
				fontSize: 1,
				lineHeight: 1,
			},
			small: {
				fontFamily: 0,
				fontWeight: 0,
				fontSize: 0,
				lineHeight: 0,
			},
		},
		button: {
			fontFamily: 0,
			fontWeight: 1,
			fontSize: 1,
			lineHeight: 1,
		},
		caption: {
			fontFamily: 0,
			fontWeight: 0,
			fontSize: 0,
			lineHeight: 0,
		},
		label: {
			fontFamily: 0,
			fontWeight: 1,
			fontSize: 0,
			lineHeight: 0,
		},
	},
} );
