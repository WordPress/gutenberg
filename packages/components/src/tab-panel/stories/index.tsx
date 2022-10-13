/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';

/**
 * Internal dependencies
 */
import TabPanel from '..';

const meta: ComponentMeta< typeof TabPanel > = {
	title: 'Components/TabPanel',
	component: TabPanel,
	parameters: {
		controls: { expanded: true },
	},
};
export default meta;

const Template: ComponentStory< typeof TabPanel > = ( props ) => {
	return <TabPanel { ...props } />;
};

export const Default = Template.bind( {} );
Default.args = {
	children: ( tab ) => <p>Selected tab: { tab.title }</p>,
	tabs: [
		{
			name: 'tab1',
			title: 'Tab 1',
		},
		{
			name: 'tab2',
			title: 'Tab 2',
		},
	],
};
