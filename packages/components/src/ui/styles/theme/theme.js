export { config } from './config';
export { darkModeConfig } from './dark-mode-config';
export { highContrastModeConfig } from './high-contrast-mode-config';
export { darkHighContrastModeConfig } from './dark-high-contrast-mode-config';

/* eslint-disable jsdoc/valid-types */
/**
 * @typedef {
	| 'blue'
	| 'red'
	| 'purple'
	| 'green'
	| 'yellow'
	| 'orange'
	| 'darkGray'
	| 'lightGray'
	} SupportedColors
 */
/* eslint-enable jsdoc/valid-types */

/** @type {SupportedColors[]} */
export const SUPPORTED_COLORS = [
	'blue',
	'red',
	'purple',
	'green',
	'yellow',
	'orange',
	'darkGray',
	'lightGray',
];
