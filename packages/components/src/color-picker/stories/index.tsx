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
import { ColorPicker } from '../component';

const meta: ComponentMeta< typeof ColorPicker > = {
	component: ColorPicker,
	title: 'Components/ColorPicker',
	argTypes: {
		as: { control: { type: null } },
		color: { control: { type: null } },
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

const Template: ComponentStory< typeof ColorPicker > = ( {
	onChange,
	...props
} ) => {
	const [ color, setColor ] = useState< string | undefined >();

	return (
		<ColorPicker
			{ ...props }
			color={ color }
			onChange={ ( ...changeArgs ) => {
				onChange?.( ...changeArgs );
				setColor( ...changeArgs );
			} }
		/>
	);
};

export const Default = Template.bind( {} );
