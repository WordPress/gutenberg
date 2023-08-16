/**
 * External dependencies
 */
import type { Meta, ComponentStory } from '@storybook/react';

/**
 * Internal dependencies
 */
import ColorIndicator from '..';

const meta: Meta< typeof ColorIndicator > = {
	component: ColorIndicator,
	title: 'Components/ColorIndicator',
	argTypes: {
		colorValue: {
			control: { type: 'color' },
		},
	},
	parameters: {
		controls: {
			expanded: true,
		},
		docs: { source: { state: 'open' } },
	},
};
export default meta;

const Template: ComponentStory< typeof ColorIndicator > = ( { ...args } ) => (
	<ColorIndicator { ...args } />
);

export const Default: ComponentStory< typeof ColorIndicator > = Template.bind(
	{}
);
Default.args = {
	colorValue: '#0073aa',
};
