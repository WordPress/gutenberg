/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';

/**
 * Internal dependencies
 */
import ColorIndicator from '..';

const meta: Meta< typeof ColorIndicator > = {
	component: ColorIndicator,
	title: 'Components/Selection & Input/Color/ColorIndicator',
	id: 'components-colorindicator',
	argTypes: {
		colorValue: {
			control: { type: 'color' },
		},
	},
	parameters: {
		controls: {
			expanded: true,
		},
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

const Template: StoryFn< typeof ColorIndicator > = ( { ...args } ) => (
	<ColorIndicator { ...args } />
);

export const Default: StoryFn< typeof ColorIndicator > = Template.bind( {} );
Default.args = {
	colorValue: '#0073aa',
};
