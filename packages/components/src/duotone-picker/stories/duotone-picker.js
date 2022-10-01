/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { DuotonePicker } from '../';

export default {
	title: 'Components/DuotonePicker',
	component: DuotonePicker,
	argTypes: {
		clearable: { control: { type: 'boolean' } },
		disableCustomColors: { control: { type: 'boolean' } },
		disableCustomDuotone: { control: { type: 'boolean' } },
		onChange: { action: 'onChange' },
		unsetable: { control: { type: 'boolean' } },
	},
	parameters: {
		controls: { expanded: true },
		docs: { source: { state: 'open' } },
	},
};

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

const COLOR_PALETTE = [
	{ color: '#ff4747', name: 'Red', slug: 'red' },
	{ color: '#fcff41', name: 'Yellow', slug: 'yellow' },
	{ color: '#000097', name: 'Blue', slug: 'blue' },
	{ color: '#8c00b7', name: 'Purple', slug: 'purple' },
];

const Template = ( { onChange, ...args } ) => {
	const [ value, setValue ] = useState();

	return (
		<DuotonePicker
			{ ...args }
			onChange={ ( ...changeArgs ) => {
				setValue( ...changeArgs );
				onChange( ...changeArgs );
			} }
			value={ value }
		/>
	);
};

export const Default = Template.bind( {} );
Default.args = {
	colorPalette: COLOR_PALETTE,
	duotonePalette: DUOTONE_PALETTE,
};
