/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { closeSmall } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { Tabs, TabsList, Tab, TabPanel } from '..';
import Button from '../../button';
import './style.css';

const meta: ComponentMeta< typeof Tabs > = {
	title: 'Components/Tabs',
	component: Tabs,
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		controls: { expanded: true },
		docs: { source: { state: 'open' } },
	},
};
export default meta;

const Template: ComponentStory< typeof Tabs > = ( props ) => {
	return <Tabs { ...props } />;
};

export const Default = Template.bind( {} );
Default.args = {
	defaultValue: 'tab-1',
	children: (
		<>
			<TabsList className="tabs-story-default__tabs-list">
				<Tab value="tab-1">Tab 1</Tab>
				<Tab value="tab-2">Tab 2</Tab>
			</TabsList>
			<TabPanel value="tab-1">You see the content of tab 1</TabPanel>
			<TabPanel value="tab-2">You see the content of tab 2</TabPanel>
		</>
	),
};

export const DisabledTab = Template.bind( {} );
DisabledTab.args = {
	defaultValue: 'tab-2',
	children: (
		<>
			<TabsList>
				<Tab value="tab-1" disabled>
					Tab 1
				</Tab>
				<Tab value="tab-2">Tab 2</Tab>
				<Tab value="tab-3">Tab 3</Tab>
			</TabsList>
			<TabPanel value="tab-1">You see the content of tab 1</TabPanel>
			<TabPanel value="tab-2">You see the content of tab 2</TabPanel>
			<TabPanel value="tab-3">You see the content of tab 3</TabPanel>
		</>
	),
};

export const ToBeNamedStory = Template.bind( {} );
ToBeNamedStory.args = {
	defaultValue: 'tab-1',
	children: (
		<>
			<TabsList className="tabs-story-tbn__tabs-list">
				<Tab value="tab-1">Tab 1</Tab>
				<Tab value="tab-2">Tab 2</Tab>
				<Button icon={ closeSmall } label="Some Action" />
			</TabsList>
			<TabPanel value="tab-1">You see the content of tab 1</TabPanel>
			<TabPanel value="tab-2">You see the content of tab 2</TabPanel>
		</>
	),
};
