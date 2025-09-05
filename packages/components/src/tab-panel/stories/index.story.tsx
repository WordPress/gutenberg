/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';
import { fn } from '@storybook/test';

/**
 * WordPress dependencies
 */
import { link, more, wordpress } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import TabPanel from '..';

const meta: Meta< typeof TabPanel > = {
	title: 'Components/Containers/TabPanel',
	id: 'components-tabpanel',
	component: TabPanel,
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
	},
	args: {
		onSelect: fn(),
	},
};
export default meta;

const Template: StoryFn< typeof TabPanel > = ( props ) => {
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

const SlotFillTemplate: StoryFn< typeof TabPanel > = ( props ) => {
	return <TabPanel { ...props } />;
};

export const WithTabIconsAndTooltips = SlotFillTemplate.bind( {} );
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

export const ManualActivation = Template.bind( {} );
ManualActivation.args = {
	...Default.args,
	selectOnMove: false,
};
