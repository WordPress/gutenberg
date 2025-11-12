/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { AnglePickerControl } from '..';

const meta: Meta< typeof AnglePickerControl > = {
	title: 'Components/AnglePickerControl',
	component: AnglePickerControl,
	argTypes: {
		as: { control: false },
		value: { control: false },
	},
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		controls: {
			expanded: true,
		},
		docs: { canvas: { sourceState: 'shown' } },
	},
};

export default meta;

const AnglePickerWithState: StoryFn< typeof AnglePickerControl > = ( {
	onChange,
	...args
} ) => {
	const [ angle, setAngle ] = useState< number >( 0 );

	const handleChange = ( newValue: number ) => {
		setAngle( newValue );
		onChange( newValue );
	};

	return (
		<AnglePickerControl
			{ ...args }
			value={ angle }
			onChange={ handleChange }
		/>
	);
};

export const Default = AnglePickerWithState.bind( {} );
