/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ColorPalette from '../';

const meta = {
	title: 'Components/ColorPalette',
	component: ColorPalette,
	argTypes: {
		__experimentalHasMultipleOrigins: {
			control: {
				type: null,
			},
		},
		__experimentalIsRenderedInSidebar: {
			control: {
				type: 'boolean',
			},
		},
		clearable: {
			control: {
				type: 'boolean',
			},
		},
		disableCustomColors: {
			control: {
				type: 'boolean',
			},
		},
	},
	parameters: {
		controls: { expanded: true },
		docs: { source: { state: 'open' } },
	},
};
export default meta;

const Template = ( args ) => {
	const [ color, setColor ] = useState( '#f00' );
	return <ColorPalette { ...args } value={ color } onChange={ setColor } />;
};

export const Default = Template.bind( {} );
Default.args = {
	colors: [
		{ name: 'Red', color: '#f00' },
		{ name: 'White', color: '#fff' },
		{ name: 'Blue', color: '#00f' },
	],
};

/**
 * When setting the `__experimentalHasMultipleOrigins` prop to `true`,
 * the `colors` prop is expected to be an array of color palettes, rather
 * than an array of color objects.
 */
export const MultipleOrigins = Template.bind( {} );
MultipleOrigins.args = {
	__experimentalHasMultipleOrigins: true,
	colors: [
		{
			name: 'Primary colors',
			colors: [
				{ name: 'Red', color: '#f00' },
				{ name: 'Yellow', color: '#ff0' },
				{ name: 'Blue', color: '#00f' },
			],
		},
		{
			name: 'Primary colors',
			colors: [
				{ name: 'Orange', color: '#f60' },
				{ name: 'Green', color: '#0f0' },
				{ name: 'Purple', color: '#60f' },
			],
		},
	],
};
