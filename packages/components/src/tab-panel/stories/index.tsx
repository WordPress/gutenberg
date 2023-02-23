/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { link, more, wordpress } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import TabPanel from '..';

const meta: ComponentMeta< typeof TabPanel > = {
	title: 'Components/TabPanel',
	component: TabPanel,
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		controls: { expanded: true },
		docs: { source: { state: 'open' } },
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

export const DisabledTab = Template.bind( {} );
DisabledTab.args = {
	children: ( tab ) => <p>Selected tab: { tab.title }</p>,
	tabs: [
		{
			name: 'tab1',
			title: 'Tab 1',
			disabled: true,
		},
		{
			name: 'tab2',
			title: 'Tab 2',
		},
		{
			name: 'tab3',
			title: 'Tab 3',
		},
	],
};

export const WithTabIconsAndTooltips = Template.bind( {} );
WithTabIconsAndTooltips.args = {
	children: ( tab ) => <p>Selected tab: { tab.title }</p>,
	tabs: [
		{
			name: 'tab1',
			title: 'Tab 1',
			icon: wordpress,
		},
		{
			name: 'tab2',
			title: 'Tab 2',
			icon: link,
		},
		{
			name: 'tab3',
			title: 'Tab 3',
			icon: more,
		},
	],
};
