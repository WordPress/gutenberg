/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ScreenTextColor from './screen-text-color';

export const elements = [
	{
		name: 'text',
		typography: {
			description: __( 'Manage the fonts used on the site.' ),
			title: __( 'Text' ),
		},
		colors: {
			title: __( 'Text' ),
			description: __(
				'Set the default color used for text across the site.'
			),
			component: ScreenTextColor,
		},
	},
	{
		name: 'link',
		typography: {
			description: __(
				'Manage the fonts and typography used on the links.'
			),
			title: __( 'Links' ),
		},
		colors: {
			title: __( 'Links' ),
			description: __(
				'Set the default color used for links across the site.'
			),
		},
	},
	{
		name: 'button',
		typography: {
			description: __(
				'Manage the fonts and typography used on buttons.'
			),
			title: __( 'Buttons' ),
		},
		colors: {
			title: __( 'Buttons' ),
			description: __(
				'Set the default color used for buttons across the site.'
			),
		},
	},
];

export const elementsWithTypography = elements.filter(
	( element ) => element.typography
);

export const elementsWithColors = elements.filter(
	( element ) => element.colors
);

export const elementsByName = Object.fromEntries(
	elements.map( ( element ) => [ element.name, element ] )
);

export default elements;
