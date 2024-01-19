/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { wordpress, more, link } from '@wordpress/icons';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Tabs from '..';
import { Slot, Fill, Provider as SlotFillProvider } from '../../slot-fill';
import DropdownMenu from '../../dropdown-menu';
import Button from '../../button';

const meta: Meta< typeof Tabs > = {
	title: 'Components (Experimental)/Tabs',
	component: Tabs,
	subcomponents: {
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		'Tabs.TabList': Tabs.TabList,
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		'Tabs.Tab': Tabs.Tab,
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		'Tabs.TabPanel': Tabs.TabPanel,
	},
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		badges: [ 'private' ],
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

const Template: StoryFn< typeof Tabs > = ( props ) => {
	return (
		<Tabs { ...props }>
			<Tabs.TabList>
				<Tabs.Tab tabId="tab1">Tab 1</Tabs.Tab>
				<Tabs.Tab tabId="tab2">Tab 2</Tabs.Tab>
				<Tabs.Tab tabId="tab3">Tab 3</Tabs.Tab>
			</Tabs.TabList>
			<Tabs.TabPanel tabId="tab1">
				<p>Selected tab: Tab 1</p>
			</Tabs.TabPanel>
			<Tabs.TabPanel tabId="tab2">
				<p>Selected tab: Tab 2</p>
			</Tabs.TabPanel>
			<Tabs.TabPanel tabId="tab3" focusable={ false }>
				<p>Selected tab: Tab 3</p>
				<p>
					This tabpanel has its <code>focusable</code> prop set to
					<code> false</code>, so it won&apos;t get a tab stop.
					<br />
					Instead, the [Tab] key will move focus to the first
					focusable element within the panel.
				</p>
				<Button variant="primary">I&apos;m a button!</Button>
			</Tabs.TabPanel>
		</Tabs>
	);
};

export const Default = Template.bind( {} );

const DisabledTabTemplate: StoryFn< typeof Tabs > = ( props ) => {
	return (
		<Tabs { ...props }>
			<Tabs.TabList>
				<Tabs.Tab tabId="tab1" disabled={ true }>
					Tab 1
				</Tabs.Tab>
				<Tabs.Tab tabId="tab2">Tab 2</Tabs.Tab>
				<Tabs.Tab tabId="tab3">Tab 3</Tabs.Tab>
			</Tabs.TabList>
			<Tabs.TabPanel tabId="tab1">
				<p>Selected tab: Tab 1</p>
			</Tabs.TabPanel>
			<Tabs.TabPanel tabId="tab2">
				<p>Selected tab: Tab 2</p>
			</Tabs.TabPanel>
			<Tabs.TabPanel tabId="tab3">
				<p>Selected tab: Tab 3</p>
			</Tabs.TabPanel>
		</Tabs>
	);
};
export const DisabledTab = DisabledTabTemplate.bind( {} );

const WithTabIconsAndTooltipsTemplate: StoryFn< typeof Tabs > = ( props ) => {
	return (
		<Tabs { ...props }>
			<Tabs.TabList>
				<Tabs.Tab
					tabId="tab1"
					render={
						<Button icon={ wordpress } label="Tab 1" showTooltip />
					}
				/>
				<Tabs.Tab
					tabId="tab2"
					render={
						<Button icon={ link } label="Tab 2" showTooltip />
					}
				/>
				<Tabs.Tab
					tabId="tab3"
					render={
						<Button icon={ more } label="Tab 3" showTooltip />
					}
				/>
			</Tabs.TabList>
			<Tabs.TabPanel tabId="tab1">
				<p>Selected tab: Tab 1</p>
			</Tabs.TabPanel>
			<Tabs.TabPanel tabId="tab2">
				<p>Selected tab: Tab 2</p>
			</Tabs.TabPanel>
			<Tabs.TabPanel tabId="tab3">
				<p>Selected tab: Tab 3</p>
			</Tabs.TabPanel>
		</Tabs>
	);
};
export const WithTabIconsAndTooltips = WithTabIconsAndTooltipsTemplate.bind(
	{}
);

export const ManualActivation = Template.bind( {} );
ManualActivation.args = {
	selectOnMove: false,
};

const UsingSlotFillTemplate: StoryFn< typeof Tabs > = ( props ) => {
	return (
		<SlotFillProvider>
			<Tabs { ...props }>
				<Tabs.TabList>
					<Tabs.Tab tabId="tab1">Tab 1</Tabs.Tab>
					<Tabs.Tab tabId="tab2">Tab 2</Tabs.Tab>
					<Tabs.Tab tabId="tab3">Tab 3</Tabs.Tab>
				</Tabs.TabList>
				<Fill name="tabs-are-fun">
					<Tabs.TabPanel tabId="tab1">
						<p>Selected tab: Tab 1</p>
					</Tabs.TabPanel>
					<Tabs.TabPanel tabId="tab2">
						<p>Selected tab: Tab 2</p>
					</Tabs.TabPanel>
					<Tabs.TabPanel tabId="tab3">
						<p>Selected tab: Tab 3</p>
					</Tabs.TabPanel>
				</Fill>
			</Tabs>
			<div
				style={ {
					border: '2px solid #999',
					width: '300px',
					margin: '20px auto',
				} }
			>
				<p>other stuff</p>
				<p>other stuff</p>
				<p>this is fun!</p>
				<p>other stuff</p>
				<Slot bubblesVirtually as="div" name="tabs-are-fun" />
			</div>
		</SlotFillProvider>
	);
};
export const UsingSlotFill = UsingSlotFillTemplate.bind( {} );
UsingSlotFill.storyName = 'Using SlotFill';

const CloseButtonTemplate: StoryFn< typeof Tabs > = ( props ) => {
	const [ isOpen, setIsOpen ] = useState( true );

	return (
		<>
			{ isOpen ? (
				<div
					style={ {
						width: '400px',
						height: '100vh',
						borderRight: '1px solid #333',
					} }
				>
					<Tabs { ...props }>
						<div
							style={ {
								display: 'flex',
								borderBottom: '1px solid #333',
							} }
						>
							<Tabs.TabList>
								<Tabs.Tab tabId="tab1">Tab 1</Tabs.Tab>
								<Tabs.Tab tabId="tab2">Tab 2</Tabs.Tab>
								<Tabs.Tab tabId="tab3">Tab 3</Tabs.Tab>
							</Tabs.TabList>
							<Button
								variant={ 'tertiary' }
								style={ {
									marginLeft: 'auto',
									alignSelf: 'center',
								} }
								onClick={ () => setIsOpen( false ) }
							>
								Close Tabs
							</Button>
						</div>
						<Tabs.TabPanel tabId="tab1">
							<p>Selected tab: Tab 1</p>
						</Tabs.TabPanel>
						<Tabs.TabPanel tabId="tab2">
							<p>Selected tab: Tab 2</p>
						</Tabs.TabPanel>
						<Tabs.TabPanel tabId="tab3">
							<p>Selected tab: Tab 3</p>
						</Tabs.TabPanel>
					</Tabs>
				</div>
			) : (
				<Button
					variant={ 'tertiary' }
					onClick={ () => setIsOpen( true ) }
				>
					Open Tabs
				</Button>
			) }
		</>
	);
};
export const InsertCustomElements = CloseButtonTemplate.bind( {} );

const ControlledModeTemplate: StoryFn< typeof Tabs > = ( props ) => {
	const [ selectedTabId, setSelectedTabId ] = useState<
		string | undefined | null
	>( props.selectedTabId );

	return (
		<>
			<Tabs
				{ ...props }
				selectedTabId={ selectedTabId }
				onSelect={ ( selectedId ) => {
					setSelectedTabId( selectedId );
					props.onSelect?.( selectedId );
				} }
			>
				<Tabs.TabList>
					<Tabs.Tab tabId="tab1">Tab 1</Tabs.Tab>

					<Tabs.Tab tabId="tab2">Tab 2</Tabs.Tab>

					<Tabs.Tab tabId="tab3">Tab 3</Tabs.Tab>
				</Tabs.TabList>
				<Tabs.TabPanel tabId="tab1">
					<p>Selected tab: Tab 1</p>
				</Tabs.TabPanel>
				<Tabs.TabPanel tabId="tab2">
					<p>Selected tab: Tab 2</p>
				</Tabs.TabPanel>
				<Tabs.TabPanel tabId="tab3">
					<p>Selected tab: Tab 3</p>
				</Tabs.TabPanel>
			</Tabs>
			{
				<div style={ { marginTop: '200px' } }>
					<p>Select a tab:</p>
					<DropdownMenu
						controls={ [
							{
								onClick: () => setSelectedTabId( 'tab1' ),
								title: 'Tab 1',
								isActive: selectedTabId === 'tab1',
							},
							{
								onClick: () => setSelectedTabId( 'tab2' ),
								title: 'Tab 2',
								isActive: selectedTabId === 'tab2',
							},
							{
								onClick: () => setSelectedTabId( 'tab3' ),
								title: 'Tab 3',
								isActive: selectedTabId === 'tab3',
							},
						] }
						label="Choose a tab. The power is yours."
					/>
				</div>
			}
		</>
	);
};

export const ControlledMode = ControlledModeTemplate.bind( {} );
ControlledMode.args = {
	selectedTabId: 'tab3',
};

const TabBecomesDisabledTemplate: StoryFn< typeof Tabs > = ( props ) => {
	const [ disableTab2, setDisableTab2 ] = useState( false );

	return (
		<>
			<Button
				variant="primary"
				onClick={ () => setDisableTab2( ! disableTab2 ) }
			>
				{ disableTab2 ? 'Enable' : 'Disable' } Tab 2
			</Button>
			<Tabs { ...props }>
				<Tabs.TabList>
					<Tabs.Tab tabId="tab1">Tab 1</Tabs.Tab>
					<Tabs.Tab tabId="tab2" disabled={ disableTab2 }>
						Tab 2
					</Tabs.Tab>
					<Tabs.Tab tabId="tab3">Tab 3</Tabs.Tab>
				</Tabs.TabList>
				<Tabs.TabPanel tabId="tab1">
					<p>Selected tab: Tab 1</p>
				</Tabs.TabPanel>
				<Tabs.TabPanel tabId="tab2">
					<p>Selected tab: Tab 2</p>
				</Tabs.TabPanel>
				<Tabs.TabPanel tabId="tab3">
					<p>Selected tab: Tab 3</p>
				</Tabs.TabPanel>
			</Tabs>
		</>
	);
};
export const TabBecomesDisabled = TabBecomesDisabledTemplate.bind( {} );

const TabGetsRemovedTemplate: StoryFn< typeof Tabs > = ( props ) => {
	const [ removeTab1, setRemoveTab1 ] = useState( false );

	return (
		<>
			<Button
				variant="primary"
				onClick={ () => setRemoveTab1( ! removeTab1 ) }
			>
				{ removeTab1 ? 'Restore' : 'Remove' } Tab 1
			</Button>
			<Tabs { ...props }>
				<Tabs.TabList>
					{ ! removeTab1 && <Tabs.Tab tabId="tab1">Tab 1</Tabs.Tab> }
					<Tabs.Tab tabId="tab2">Tab 2</Tabs.Tab>
					<Tabs.Tab tabId="tab3">Tab 3</Tabs.Tab>
				</Tabs.TabList>
				<Tabs.TabPanel tabId="tab1">
					<p>Selected tab: Tab 1</p>
				</Tabs.TabPanel>
				<Tabs.TabPanel tabId="tab2">
					<p>Selected tab: Tab 2</p>
				</Tabs.TabPanel>
				<Tabs.TabPanel tabId="tab3">
					<p>Selected tab: Tab 3</p>
				</Tabs.TabPanel>
			</Tabs>
		</>
	);
};
export const TabGetsRemoved = TabGetsRemovedTemplate.bind( {} );
