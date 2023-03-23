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
import { ColorPicker } from '..';

const meta: ComponentMeta< typeof ColorPicker > = {
	component: ColorPicker,
	title: 'Components/ColorPicker',
	argTypes: {
		color: { control: { type: null } },
		copyFormat: {
			control: { type: 'select' },
			options: [ 'rgb', 'hsl', 'hex', undefined ],
		},
		onChangeComplete: {
			table: {
				disable: true,
			},
		},
		oldHue: {
			table: {
				disable: true,
			},
		},
		disableAlpha: {
			table: {
				disable: true,
			},
		},
		// We can't use a `on*` regex because this component will switch to
		// legacy mode when an onChangeComplete prop is passed.
		onChange: { action: 'onChange' },
	},
	parameters: {
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
