/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';

/**
 * Internal dependencies
 */
import Tip from '..';

const meta: Meta< typeof Tip > = {
	component: Tip,
	title: 'Components/Feedback/Tip',
	id: 'components-tip',
	argTypes: {
		children: { control: { type: 'text' } },
	},
	parameters: {
		controls: {
			expanded: true,
		},
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

const Template: StoryFn< typeof Tip > = ( args ) => {
	return <Tip { ...args } />;
};

export const Default: StoryFn< typeof Tip > = Template.bind( {} );
Default.args = {
	children: 'An example tip',
};
