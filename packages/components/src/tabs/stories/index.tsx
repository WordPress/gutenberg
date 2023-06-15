/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { wordpress, more, link } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Tabs from '..';
import Popover from '../../popover';
import { Provider as SlotFillProvider } from '../../slot-fill';

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

// SlotFillTemplate is used to ensure the icon's tooltips are not rendered
// inline, as that would cause them to inherit the tab's opacity.
const SlotFillTemplate: ComponentStory< typeof Tabs > = ( props ) => {
	return (
		<SlotFillProvider>
			<Tabs { ...props } />
			{ /* @ts-expect-error The 'Slot' component hasn't been typed yet. */ }
			<Popover.Slot />
		</SlotFillProvider>
	);
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
