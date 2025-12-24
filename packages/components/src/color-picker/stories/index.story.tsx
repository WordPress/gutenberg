/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';

/**
 * Internal dependencies
 */
import { ColorPicker } from '../component';

const meta: Meta< typeof ColorPicker > = {
	component: ColorPicker,
	title: 'Components/Selection & Input/Color/ColorPicker',
	id: 'components-colorpicker',
	argTypes: {
		as: { control: false },
		color: { control: false },
	},
	args: {
		onChange: fn(),
	},
	parameters: {
		controls: {
			expanded: true,
		},
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

export const Default: StoryObj< typeof ColorPicker > = {};
