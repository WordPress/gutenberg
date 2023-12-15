/**
 * External dependencies
 */
import type { StoryFn } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import FontSizePicker from '../..';

export default {
	title: 'Components/FontSizePicker',
	component: FontSizePicker,
};

const FontSizePickerWithState: StoryFn< typeof FontSizePicker > = ( {
	value,
	...props
} ) => {
	const [ fontSize, setFontSize ] = useState( value );
	return (
		<FontSizePicker
			{ ...props }
			value={ fontSize }
			onChange={ setFontSize }
		/>
	);
};

export const Default: StoryFn< typeof FontSizePicker > =
	FontSizePickerWithState.bind( {} );
Default.args = {
	fontSizes: [
		{
			name: 'Small',
			slug: 'small',
			size: 12,
		},
		{
			name: 'Normal',
			slug: 'normal',
			size: 16,
		},
		{
			name: 'Big',
			slug: 'big',
			size: 26,
		},
	],
	value: 16,
};
