import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useState } from '@wordpress/element';
import { DuotonePicker } from '..';

const meta: Meta< typeof DuotonePicker > = {
	title: 'Components/DuotonePicker',
	component: DuotonePicker,
	args: {
		onChange: fn(),
	},
	argTypes: {
		selectedSlug: { control: false },
		value: { control: false },
	},
	parameters: {
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
		componentStatus: {
			status: 'recommended',
			whereUsed: 'editor',
		},
	},
};
export default meta;

type DuotonePickerStory = StoryObj< typeof DuotonePicker >;

const DUOTONE_PALETTE = [
	{
		colors: [ '#8c00b7', '#fcff41' ],
		name: 'Purple and yellow',
		slug: 'purple-yellow',
	},
	{
		colors: [ '#000097', '#ff4747' ],
		name: 'Blue and red',
		slug: 'blue-red',
	},
];

// Two presets holding the same colors. Adding duotones with the `+` button in
// the Global Styles palette editor seeds each one from the palette's darkest
// and lightest colors, so this is the normal case rather than a contrived one.
const DUPLICATE_DUOTONE_PALETTE = [
	{
		colors: [ '#000000', '#ffffff' ],
		name: 'Dark background',
		slug: 'dark-background',
	},
	{
		colors: [ '#000000', '#ffffff' ],
		name: 'Dark text',
		slug: 'dark-text',
	},
];

const COLOR_PALETTE = [
	{ color: '#ff4747', name: 'Red', slug: 'red' },
	{ color: '#fcff41', name: 'Yellow', slug: 'yellow' },
	{ color: '#000097', name: 'Blue', slug: 'blue' },
	{ color: '#8c00b7', name: 'Purple', slug: 'purple' },
];

const Template = ( {
	onChange,
	value,
	selectedSlug,
	...props
}: React.ComponentProps< typeof DuotonePicker > ) => {
	const [ duotone, setDuotone ] =
		useState< React.ComponentProps< typeof DuotonePicker >[ 'value' ] >(
			value
		);
	const [ slug, setSlug ] = useState< string | undefined >( selectedSlug );
	return (
		<DuotonePicker
			{ ...props }
			value={ duotone }
			selectedSlug={ slug }
			onChange={ ( newValue, index, newSlug ) => {
				setDuotone( newValue );
				setSlug( newSlug );
				onChange?.( newValue, index, newSlug );
			} }
		/>
	);
};

export const Default: DuotonePickerStory = {
	render: Template,
	args: {
		colorPalette: COLOR_PALETTE,
		duotonePalette: DUOTONE_PALETTE,
	},
};

export const DuplicateDuotones: DuotonePickerStory = {
	render: Template,
	args: {
		colorPalette: COLOR_PALETTE,
		duotonePalette: DUPLICATE_DUOTONE_PALETTE,
	},
	parameters: {
		docs: {
			description: {
				story: 'Two presets can hold the same pair of colors. Selection is tracked by slug, so picking one marks only that preset rather than both.',
			},
		},
	},
};
