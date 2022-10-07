/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';

/**
 * Internal dependencies
 */
import Tip from '..';

const meta: ComponentMeta< typeof Tip > = {
	component: Tip,
	title: 'Components/Tip',
	argTypes: {
		children: { control: { type: 'text' } },
	},
	parameters: {
		controls: {
			expanded: true,
		},
		docs: { source: { state: 'open' } },
	},
};
export default meta;

const Template: ComponentStory< typeof Tip > = ( args ) => {
	return <Tip { ...args } />;
};

export const Default: ComponentStory< typeof Tip > = Template.bind( {} );
Default.args = {
	children: 'An example tip',
};
