/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { AnglePickerControl } from '..';

const meta: ComponentMeta< typeof AnglePickerControl > = {
	title: 'Components/AnglePickerControl',
	component: AnglePickerControl,
	argTypes: {
		as: { control: { type: null } },
		value: { control: { type: null } },
	},
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		controls: {
			expanded: true,
		},
		docs: { source: { state: 'open' } },
	},
};

export default meta;

const AnglePickerWithState: ComponentStory< typeof AnglePickerControl > = ( {
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
Default.args = {
	__nextHasNoMarginBottom: true,
};
