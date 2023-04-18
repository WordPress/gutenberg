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
			<TabsList>
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
	defaultValue: 'post',
	children: (
		<>
			<div style={ { display: 'flex', alignItems: 'center' } }>
				<TabsList>
					<Tab value="post">Post</Tab>
					<Tab value="block">Block</Tab>
				</TabsList>
				<Button
					icon={ closeSmall }
					label="Some Action"
					style={ { marginLeft: 'auto' } }
				/>
			</div>
			<TabPanel value="post">Show post settings</TabPanel>
			<TabPanel value="block">Show block settings</TabPanel>
		</>
	),
};

ToBeNamedStory.decorators = [
	( Story ) => (
		<div style={ { width: '280px' } }>
			<Story />
		</div>
	),
];
