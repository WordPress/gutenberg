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
import { ColorPicker } from '../component';

const meta: Meta< typeof ColorPicker > = {
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
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

const Template: StoryFn< typeof ColorPicker > = ( { onChange, ...props } ) => {
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
