/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

/**
 * Internal dependencies
 */
import { ColorPicker } from '../component';

const meta: Meta< typeof ColorPicker > = {
	tags: [ 'manifest' ],
	component: ColorPicker,
	// Temporary: Due to an upstream bug, render the root explicitly so the
	// components manifest extractor can resolve props from the JSX.
	//
	// See: https://github.com/storybookjs/storybook/issues/34877
	render: ( args ) => <ColorPicker { ...args } />,
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
		componentStatus: {
			status: 'recommended',
			whereUsed: 'global',
		},
	},
};
export default meta;

export const Default: StoryObj< typeof ColorPicker > = {};
