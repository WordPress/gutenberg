/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';

/**
 * WordPress dependencies
 */
// import { wordpress, more, link } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Tabs from '..';
// import Popover from '../../popover';
// import { Provider as SlotFillProvider } from '../../slot-fill';

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
	const tabStore = Tabs.useTabStore( { tabs: props.tabs! } ); //TODO: remove bang
	return (
		<Tabs { ...props }>
			<Tabs.TabList tabStore={ tabStore }>
				{ props.tabs?.map( ( tab ) => (
					<Tabs.Tab
						tabStore={ tabStore }
						key={ tab.name }
						id={ tab.name }
					>
						{ tab.title }
					</Tabs.Tab>
				) ) }
			</Tabs.TabList>
			{ props.tabs?.map( ( tab ) => (
				<Tabs.TabPanel
					tabStore={ tabStore }
					key={ tab.name }
					id={ tab.name }
				>
					Selected tab: { tab.title }
				</Tabs.TabPanel>
			) ) }
		</Tabs>
	);
};

export const Default = Template.bind( {} );
Default.args = {
	// children: ( tab: any ) => <p>Selected tab: { tab.title }</p>,
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

// export const DisabledTab = Template.bind( {} );
// DisabledTab.args = {
// 	children: ( tab ) => <p>Selected tab: { tab.title }</p>,
// 	tabs: [
// 		{
// 			name: 'tab1',
// 			title: 'Tab 1',
// 			disabled: true,
// 		},
// 		{
// 			name: 'tab2',
// 			title: 'Tab 2',
// 		},
// 		{
// 			name: 'tab3',
// 			title: 'Tab 3',
// 		},
// 	],
// };

// // SlotFillTemplate is used to ensure the icon's tooltips are not rendered
// // inline, as that would cause them to inherit the tab's opacity.
// const SlotFillTemplate: ComponentStory< typeof TabPanelV2 > = ( props ) => {
// 	return (
// 		<SlotFillProvider>
// 			<TabPanelV2 { ...props } />
// 			{ /* @ts-expect-error The 'Slot' component hasn't been typed yet. */ }
// 			<Popover.Slot />
// 		</SlotFillProvider>
// 	);
// };

// export const WithTabIconsAndTooltips = SlotFillTemplate.bind( {} );
// WithTabIconsAndTooltips.args = {
// 	children: ( tab ) => <p>Selected tab: { tab.title }</p>,
// 	tabs: [
// 		{
// 			name: 'tab1',
// 			title: 'Tab 1',
// 			icon: wordpress,
// 		},
// 		{
// 			name: 'tab2',
// 			title: 'Tab 2',
// 			icon: link,
// 		},
// 		{
// 			name: 'tab3',
// 			title: 'Tab 3',
// 			icon: more,
// 		},
// 	],
// };

// export const ManualActivation = Template.bind( {} );
// ManualActivation.args = {
// 	children: ( tab ) => <p>Selected tab: { tab.title }</p>,
// 	tabs: [
// 		{
// 			name: 'tab1',
// 			title: 'Tab 1',
// 		},
// 		{
// 			name: 'tab2',
// 			title: 'Tab 2',
// 		},
// 	],
// 	selectOnMove: false,
// };
