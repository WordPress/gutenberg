/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ColorPalette from '../';
import Popover from '../../popover';
import { Provider as SlotFillProvider } from '../../slot-fill';

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
	const firstColor =
		args.colors[ 0 ].color || args.colors[ 0 ].colors[ 0 ].color;
	const [ color, setColor ] = useState( firstColor );

	return (
		<SlotFillProvider>
			<ColorPalette { ...args } value={ color } onChange={ setColor } />
			<Popover.Slot />
		</SlotFillProvider>
	);
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

export const CSSVariables = ( args ) => {
	return (
		<div
			style={ {
				'--red': '#f00',
				'--yellow': '#ff0',
				'--blue': '#00f',
			} }
		>
			<Template { ...args } />
		</div>
	);
};
CSSVariables.args = {
	colors: [
		{ name: 'Red', color: 'var(--red)' },
		{ name: 'Yellow', color: 'var(--yellow)' },
		{ name: 'Blue', color: 'var(--blue)' },
	],
};
