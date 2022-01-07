/**
 * External dependencies
 */
import { render, screen, fireEvent, within } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { ToolsPanel, ToolsPanelContext, ToolsPanelItem } from '../';
import { createSlotFill, Provider as SlotFillProvider } from '../../slot-fill';

const { Fill: ToolsPanelItems, Slot } = createSlotFill( 'ToolsPanelSlot' );
const resetAll = jest.fn();
const noop = () => undefined;

// Default props for the tools panel.
const defaultProps = {
	label: 'Panel header',
	resetAll,
};

// Default props for an enabled control to be rendered within panel.
const controlProps = {
	attributes: { value: true },
	hasValue: jest.fn().mockImplementation( () => {
		return !! controlProps.attributes.value;
	} ),
	label: 'Example',
	onDeselect: jest.fn().mockImplementation( () => {
		controlProps.attributes.value = undefined;
	} ),
	onSelect: jest.fn(),
};

// Default props without a value for an alternate control to be rendered within
// the panel.
const altControlProps = {
	attributes: { value: false },
	hasValue: jest.fn().mockImplementation( () => {
		return !! altControlProps.attributes.value;
	} ),
	label: 'Alt',
	onDeselect: jest.fn(),
	onSelect: jest.fn(),
};

// Default props for wrapped or grouped panel items.
const nestedControlProps = {
	attributes: { value: true },
	hasValue: jest.fn().mockImplementation( () => {
		return !! nestedControlProps.attributes.value;
	} ),
	label: 'Nested Control 1',
	onDeselect: jest.fn().mockImplementation( () => {
		nestedControlProps.attributes.value = undefined;
	} ),
	onSelect: jest.fn(),
	isShownByDefault: true,
};

// Alternative props for wrapped or grouped panel items.
const altNestedControlProps = {
	attributes: { value: false },
	hasValue: jest.fn().mockImplementation( () => {
		return !! altNestedControlProps.attributes.value;
	} ),
	label: 'Nested Control 2',
	onDeselect: jest.fn(),
	onSelect: jest.fn(),
};

// Simple custom component grouping panel items. Used to test panel item
// registration and display when not an immediate child of `ToolsPanel`.
const GroupedItems = ( {
	defaultGroupedProps = nestedControlProps,
	altGroupedProps = altNestedControlProps,
} ) => {
	return (
		<>
			<ToolsPanelItem { ...defaultGroupedProps }>
				<div>Grouped control</div>
			</ToolsPanelItem>
			<ToolsPanelItem { ...altGroupedProps }>
				<div>Alt grouped control</div>
			</ToolsPanelItem>
		</>
	);
};

// This context object is used to help simulate different scenarios in which
// `ToolsPanelItem` registration or deregistration requires testing.
const panelContext = {
	panelId: '1234',
	menuItems: {
		default: {},
		optional: { [ altControlProps.label ]: true },
	},
	hasMenuItems: false,
	isResetting: false,
	shouldRenderPlaceholderItems: false,
	registerPanelItem: jest.fn(),
	deregisterPanelItem: jest.fn(),
	flagItemCustomization: noop,
	areAllOptionalControlsHidden: true,
};

// Renders a tools panel including panel items that have been grouped within
// a custom component.
const renderGroupedItemsInPanel = () => {
	return render(
		<ToolsPanel { ...defaultProps }>
			<GroupedItems />
		</ToolsPanel>
	);
};

// Custom component rendering a panel item within a wrapping element. Also used
// to test panel item registration and rendering.
const WrappedItem = ( { text, ...props } ) => {
	return (
		<div>
			<span>Wrapper</span>
			<ToolsPanelItem { ...props }>
				<div>{ text }</div>
			</ToolsPanelItem>
		</div>
	);
};

// Renders a `ToolsPanel` with single wrapped panel item via a custom component.
const renderWrappedItemInPanel = () => {
	return render(
		<ToolsPanel { ...defaultProps }>
			<WrappedItem { ...nestedControlProps } text="Wrapped 1" />
			<WrappedItem { ...altNestedControlProps } text="Wrapped 2" />
		</ToolsPanel>
	);
};

// Renders a default tools panel including children that are
// not to be represented within the panel's menu.
const renderPanel = () => {
	return render(
		<ToolsPanel { ...defaultProps }>
			{ false && <div>Hidden</div> }
			<ToolsPanelItem { ...controlProps }>
				<div>Example control</div>
			</ToolsPanelItem>
			<ToolsPanelItem { ...altControlProps }>
				<div>Alt control</div>
			</ToolsPanelItem>
			<span>Visible</span>
		</ToolsPanel>
	);
};

/**
 * Retrieves the panel's dropdown menu toggle button.
 *
 * @return {HTMLElement} The menu button.
 */
const getMenuButton = () => {
	return screen.getByRole( 'button', {
		name: /view([\w\s]+)options/i,
	} );
};

/**
 * Helper to find the menu button and simulate a user click.
 *
 * @return {HTMLElement} The menuButton.
 */
const openDropdownMenu = () => {
	const menuButton = getMenuButton();
	fireEvent.click( menuButton );
	return menuButton;
};

// Opens dropdown then selects the menu item by label before simulating a click.
const selectMenuItem = async ( label ) => {
	openDropdownMenu();
	const menuItem = await screen.findByText( label );
	fireEvent.click( menuItem );
};

describe( 'ToolsPanel', () => {
	afterEach( () => {
		controlProps.attributes.value = true;
		altControlProps.attributes.value = false;
	} );

	describe( 'basic rendering', () => {
		it( 'should render panel', () => {
			renderPanel();

			const menuButton = getMenuButton();
			const label = screen.getByText( defaultProps.label );
			const control = screen.getByText( 'Example control' );
			const nonToolsPanelItem = screen.getByText( 'Visible' );

			expect( menuButton ).toBeInTheDocument();
			expect( label ).toBeInTheDocument();
			expect( control ).toBeInTheDocument();
			expect( nonToolsPanelItem ).toBeInTheDocument();
		} );

		it( 'should render panel item flagged as default control even without value', () => {
			render(
				<ToolsPanel { ...defaultProps }>
					<ToolsPanelItem { ...controlProps }>
						<div>Example control</div>
					</ToolsPanelItem>
					<ToolsPanelItem
						{ ...altControlProps }
						isShownByDefault={ true }
					>
						<div>Alt control</div>
					</ToolsPanelItem>
				</ToolsPanel>
			);

			const altControl = screen.getByText( 'Alt control' );

			expect( altControl ).toBeInTheDocument();
		} );

		it( 'should not render panel menu when there are no panel items', () => {
			render(
				<ToolsPanel { ...defaultProps }>
					{ false && (
						<ToolsPanelItem>Should not show</ToolsPanelItem>
					) }
					{ false && (
						<ToolsPanelItem>Not shown either</ToolsPanelItem>
					) }
					<span>Visible but insignificant</span>
				</ToolsPanel>
			);

			const menu = screen.queryByLabelText( defaultProps.label );
			expect( menu ).not.toBeInTheDocument();
		} );

		it( 'should render panel menu when at least one panel item', () => {
			renderPanel();

			const menuButton = openDropdownMenu();
			expect( menuButton ).toBeInTheDocument();
		} );

		it( 'should render reset all item in menu', async () => {
			renderPanel();
			openDropdownMenu();

			const resetAllItem = await screen.findByRole( 'menuitem' );

			expect( resetAllItem ).toBeInTheDocument();
		} );

		it( 'should render panel menu items correctly', async () => {
			renderPanel();
			openDropdownMenu();

			const menuItems = await screen.findAllByRole( 'menuitemcheckbox' );

			expect( menuItems.length ).toEqual( 2 );
			expect( menuItems[ 0 ] ).toHaveAttribute( 'aria-checked', 'true' );
			expect( menuItems[ 1 ] ).toHaveAttribute( 'aria-checked', 'false' );
		} );

		it( 'should render panel label as header text', () => {
			renderPanel();
			const header = screen.getByText( defaultProps.label );

			expect( header ).toBeInTheDocument();
		} );
	} );

	describe( 'conditional rendering of panel items', () => {
		it( 'should render panel item when it has a value', () => {
			renderPanel();

			const exampleControl = screen.getByText( 'Example control' );
			const altControl = screen.queryByText( 'Alt control' );

			expect( exampleControl ).toBeInTheDocument();
			expect( altControl ).not.toBeInTheDocument();
		} );

		it( 'should render panel item when corresponding menu item is selected', async () => {
			renderPanel();
			await selectMenuItem( altControlProps.label );
			const control = await screen.findByText( 'Alt control' );

			expect( control ).toBeInTheDocument();
		} );

		it( 'should prevent optional panel item rendering when toggled off via menu item', async () => {
			renderPanel();
			await selectMenuItem( controlProps.label );
			const control = screen.queryByText( 'Example control' );

			expect( control ).not.toBeInTheDocument();
		} );

		it( 'should continue to render shown by default item after it is toggled off via menu item', async () => {
			render(
				<ToolsPanel { ...defaultProps }>
					<ToolsPanelItem
						{ ...controlProps }
						isShownByDefault={ true }
					>
						<div>Default control</div>
					</ToolsPanelItem>
				</ToolsPanel>
			);

			const control = screen.getByText( 'Default control' );

			expect( control ).toBeInTheDocument();

			await selectMenuItem( controlProps.label );
			const resetControl = screen.getByText( 'Default control' );

			expect( resetControl ).toBeInTheDocument();
		} );

		it( 'should render appropriate menu groups', async () => {
			render(
				<ToolsPanel { ...defaultProps }>
					<ToolsPanelItem
						{ ...controlProps }
						isShownByDefault={ true }
					>
						<div>Default control</div>
					</ToolsPanelItem>
					<ToolsPanelItem { ...altControlProps }>
						<div>Optional control</div>
					</ToolsPanelItem>
				</ToolsPanel>
			);
			openDropdownMenu();

			const menuGroups = screen.getAllByRole( 'group' );

			// Groups should be: default controls, optional controls & reset all.
			expect( menuGroups.length ).toEqual( 3 );
		} );

		it( 'should not render contents of items when in placeholder state', () => {
			render(
				<ToolsPanel
					{ ...defaultProps }
					shouldRenderPlaceholderItems={ true }
				>
					<ToolsPanelItem { ...altControlProps }>
						<div>Optional control</div>
					</ToolsPanelItem>
				</ToolsPanel>
			);

			const optionalItem = screen.queryByText( 'Optional control' );

			// When rendered as a placeholder a ToolsPanelItem will just omit
			// all the item's children. So the container element will still be
			// there holding its position but the inner text etc should not be
			// there.
			expect( optionalItem ).not.toBeInTheDocument();
		} );

		it( 'should render default controls with conditional isShownByDefault', async () => {
			const linkedControlProps = {
				attributes: { value: false },
				hasValue: jest.fn().mockImplementation( () => {
					return !! linkedControlProps.attributes.value;
				} ),
				label: 'Linked',
				onDeselect: jest.fn(),
				onSelect: jest.fn(),
			};

			const TestPanel = () => (
				<ToolsPanel { ...defaultProps }>
					<ToolsPanelItem
						{ ...altControlProps }
						isShownByDefault={ true }
					>
						<div>Default control</div>
					</ToolsPanelItem>
					<ToolsPanelItem
						{ ...linkedControlProps }
						isShownByDefault={ !! altControlProps.attributes.value }
					>
						<div>Linked control</div>
					</ToolsPanelItem>
				</ToolsPanel>
			);

			const { rerender } = render( <TestPanel /> );

			// The linked control should start out as an optional control and is
			// not rendered because it does not have a value.
			let linkedItem = screen.queryByText( 'Linked control' );
			expect( linkedItem ).not.toBeInTheDocument();

			openDropdownMenu();

			// The linked control should initially appear in the optional controls
			// menu group. There should be three menu groups: default controls,
			// optional controls, and the group to reset all options.
			let menuGroups = screen.getAllByRole( 'group' );
			expect( menuGroups.length ).toEqual( 3 );

			// The linked control should be in the second group, of optional controls.
			let optionalItem = within( menuGroups[ 1 ] ).getByText( 'Linked' );
			expect( optionalItem ).toBeInTheDocument();

			// Simulate the main control having a value set which should
			// trigger the linked control becoming a default control via the
			// conditional `isShownByDefault` prop.
			altControlProps.attributes.value = true;

			rerender( <TestPanel /> );

			// The linked control should now be a default control and rendered
			// despite not having a value.
			linkedItem = screen.getByText( 'Linked control' );
			expect( linkedItem ).toBeInTheDocument();

			// The linked control should now appear in the default controls
			// menu group and have been removed from the optional group.
			menuGroups = screen.getAllByRole( 'group' );

			// There should now only be two groups. The default controls and
			// and the group for the reset all option.
			expect( menuGroups.length ).toEqual( 2 );

			// The new default control item for the Linked control should be
			// within the first menu group.
			const defaultItem = within( menuGroups[ 0 ] ).getByText( 'Linked' );
			expect( defaultItem ).toBeInTheDocument();

			// Optional controls have an additional aria-label. This can be used
			// to confirm the conditional default control has been removed from
			// the optional menu item group.
			optionalItem = screen.queryByRole( 'menuitemcheckbox', {
				name: 'Show Linked',
			} );
			expect( optionalItem ).not.toBeInTheDocument();
		} );

		it( 'should handle conditionally rendered default control', async () => {
			const conditionalControlProps = {
				attributes: { value: false },
				hasValue: jest.fn().mockImplementation( () => {
					return !! conditionalControlProps.attributes.value;
				} ),
				label: 'Conditional',
				onDeselect: jest.fn(),
				onSelect: jest.fn(),
			};

			const TestPanel = () => (
				<ToolsPanel { ...defaultProps }>
					<ToolsPanelItem
						{ ...altControlProps }
						isShownByDefault={ true }
					>
						<div>Default control</div>
					</ToolsPanelItem>
					{ !! altControlProps.attributes.value && (
						<ToolsPanelItem
							{ ...conditionalControlProps }
							isShownByDefault={ true }
						>
							<div>Conditional control</div>
						</ToolsPanelItem>
					) }
				</ToolsPanel>
			);

			const { rerender } = render( <TestPanel /> );

			// The conditional control should not yet be rendered.
			let conditionalItem = screen.queryByText( 'Conditional control' );
			expect( conditionalItem ).not.toBeInTheDocument();

			// The conditional control should not yet appear in the default controls
			// menu group.
			openDropdownMenu();
			let menuGroups = screen.getAllByRole( 'group' );
			let defaultItem = within( menuGroups[ 0 ] ).queryByText(
				'Conditional'
			);
			expect( defaultItem ).not.toBeInTheDocument();

			// Simulate the main control having a value set which will now
			// render the new default control into the ToolsPanel.
			altControlProps.attributes.value = true;

			rerender( <TestPanel /> );

			// The conditional control should now be rendered and included in
			// the panel's menu.
			conditionalItem = screen.getByText( 'Conditional control' );
			expect( conditionalItem ).toBeInTheDocument();

			// The conditional control should now appear in the default controls
			// menu group.
			menuGroups = screen.getAllByRole( 'group' );

			// The new default control item for the Conditional control should
			// be within the first menu group.
			defaultItem = within( menuGroups[ 0 ] ).getByText( 'Conditional' );
			expect( defaultItem ).toBeInTheDocument();
		} );
	} );

	describe( 'registration of panel items', () => {
		beforeEach( () => {
			jest.clearAllMocks();
		} );

		it( 'should register and deregister items when panelId changes', () => {
			// This test simulates switching block selection, which causes the
			// `ToolsPanel` to rerender with a new panelId, necessitating the
			// registration and deregistration of appropriate `ToolsPanelItem`
			// children.
			//
			// When the `panelId` changes, only items matching the new ID register
			// themselves, while those for the old panelId deregister.
			//
			// See: https://github.com/WordPress/gutenberg/pull/36588
			const context = { ...panelContext };
			const TestPanel = () => (
				<ToolsPanelContext.Provider value={ context }>
					<ToolsPanelItem { ...altControlProps } panelId="1234">
						<div>Item</div>
					</ToolsPanelItem>
				</ToolsPanelContext.Provider>
			);

			// On the initial render of the panel, the ToolsPanelItem should
			// be registered.
			const { rerender } = render( <TestPanel /> );

			expect( context.registerPanelItem ).toHaveBeenCalledWith(
				expect.objectContaining( {
					label: altControlProps.label,
					panelId: '1234',
				} )
			);
			expect( context.deregisterPanelItem ).not.toHaveBeenCalled();

			// Simulate a change in panel, e.g. a switch of block selection.
			context.panelId = '4321';
			context.menuItems.optional[ altControlProps.label ] = false;

			// Rerender the panel item. Because we have a new panelId, this
			// panelItem should NOT be registered, but it SHOULD be
			// deregistered.
			rerender( <TestPanel /> );

			// registerPanelItem has still only been called once.
			expect( context.registerPanelItem ).toHaveBeenCalledTimes( 1 );
			// deregisterPanelItem is called, given that we have switched panels.
			expect( context.deregisterPanelItem ).toBeCalledWith(
				altControlProps.label
			);

			// Simulate switching back to the original panelId, e.g. by selecting
			// the original block again.
			context.panelId = '1234';
			context.menuItems.optional[ altControlProps.label ] = true;

			// Rerender the panel and ensure that the panelItem is registered
			// again, and it is not de-registered.
			rerender( <TestPanel /> );

			expect( context.registerPanelItem ).toHaveBeenCalledWith(
				expect.objectContaining( {
					label: altControlProps.label,
					panelId: '1234',
				} )
			);
			expect( context.registerPanelItem ).toHaveBeenCalledTimes( 2 );
			// deregisterPanelItem has still only been called once.
			expect( context.deregisterPanelItem ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'should register items when ToolsPanel panelId is null', () => {
			// This test simulates when a panel spans multiple block selections.
			// Multi-selection means a panel can't have a single id to match
			// against the item's. Instead the panel gets an id of `null` and
			// individual items should still render themselves in this case.
			//
			// See: https://github.com/WordPress/gutenberg/pull/37216
			const context = { ...panelContext, panelId: null };
			const TestPanel = () => (
				<ToolsPanelContext.Provider value={ context }>
					<ToolsPanelItem { ...altControlProps } panelId="1234">
						<div>Item</div>
					</ToolsPanelItem>
				</ToolsPanelContext.Provider>
			);

			// On the initial render of the panel, the ToolsPanelItem should
			// be registered.
			const { rerender, unmount } = render( <TestPanel /> );

			expect( context.registerPanelItem ).toHaveBeenCalledWith(
				expect.objectContaining( {
					label: altControlProps.label,
					panelId: '1234',
				} )
			);
			expect( context.deregisterPanelItem ).not.toHaveBeenCalled();

			// Simulate a further block selection being added to the
			// multi-selection. The panelId will remain `null` in this case.
			rerender( <TestPanel /> );
			expect( context.registerPanelItem ).toHaveBeenCalledTimes( 1 );
			expect( context.deregisterPanelItem ).not.toHaveBeenCalled();

			// Simulate a change in panel back to single block selection for
			// which the item matches panelId.
			context.panelId = '1234';
			rerender( <TestPanel /> );
			expect( context.registerPanelItem ).toHaveBeenCalledTimes( 1 );
			expect( context.deregisterPanelItem ).not.toHaveBeenCalled();

			// Simulate another multi-selection where the panelId is `null`.
			// Item should re-register itself after it deregistered as the
			// multi-selection occurred.
			context.panelId = null;
			rerender( <TestPanel /> );
			expect( context.registerPanelItem ).toHaveBeenCalledTimes( 2 );
			expect( context.deregisterPanelItem ).toHaveBeenCalledTimes( 1 );

			// Simulate a change in panel e.g. back to a single block selection
			// Where the item's panelId is not a match.
			context.panelId = '4321';
			rerender( <TestPanel /> );

			// As the item no longer matches the panelId it should not have
			// registered again but instead deregistered.
			unmount();
			expect( context.registerPanelItem ).toHaveBeenCalledTimes( 2 );
			expect( context.deregisterPanelItem ).toHaveBeenCalledTimes( 2 );
		} );
	} );

	describe( 'callbacks on menu item selection', () => {
		beforeEach( () => {
			jest.clearAllMocks();
		} );

		it( 'should call onDeselect callback when menu item is toggled off', async () => {
			renderPanel();
			await selectMenuItem( controlProps.label );

			expect( controlProps.onSelect ).not.toHaveBeenCalled();
			expect( controlProps.onDeselect ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'should call onSelect callback when menu item is toggled on', async () => {
			renderPanel();
			await selectMenuItem( altControlProps.label );

			expect( altControlProps.onSelect ).toHaveBeenCalledTimes( 1 );
			expect( altControlProps.onDeselect ).not.toHaveBeenCalled();
		} );

		it( 'should call resetAll callback when its menu item is selected', async () => {
			renderPanel();
			await selectMenuItem( 'Reset all' );

			expect( resetAll ).toHaveBeenCalledTimes( 1 );
			expect( controlProps.onSelect ).not.toHaveBeenCalled();
			expect( controlProps.onDeselect ).not.toHaveBeenCalled();
			expect( altControlProps.onSelect ).not.toHaveBeenCalled();
			expect( altControlProps.onDeselect ).not.toHaveBeenCalled();
		} );

		// This confirms the internal `isResetting` state when resetting all
		// controls does not prevent subsequent individual reset requests.
		// i.e. onDeselect callbacks are called correctly after a resetAll.
		it( 'should call onDeselect after previous reset all', async () => {
			renderPanel();

			await selectMenuItem( 'Reset all' ); // Initial control is displayed by default.
			await selectMenuItem( controlProps.label ); // Re-display control.

			expect( controlProps.onDeselect ).not.toHaveBeenCalled();

			await selectMenuItem( controlProps.label ); // Reset control.

			expect( controlProps.onDeselect ).toHaveBeenCalled();
		} );
	} );

	describe( 'grouped panel items within custom components', () => {
		it( 'should render grouped items correctly', () => {
			renderGroupedItemsInPanel();

			const defaultItem = screen.getByText( 'Grouped control' );
			const altItem = screen.queryByText( 'Alt grouped control' );

			expect( defaultItem ).toBeInTheDocument();
			expect( altItem ).not.toBeInTheDocument();
		} );

		it( 'should render grouped items within the menu', async () => {
			renderGroupedItemsInPanel();
			openDropdownMenu();

			const defaultItem = screen.getByText( 'Nested Control 1' );
			const defaultMenuItem = screen.getByRole( 'menuitemcheckbox', {
				name: 'Reset Nested Control 1',
				checked: true,
			} );

			const altItem = screen.getByText( 'Nested Control 2' );
			const altMenuItem = screen.getByRole( 'menuitemcheckbox', {
				name: 'Show Nested Control 2',
				checked: false,
			} );

			expect( defaultItem ).toBeInTheDocument();
			expect( defaultMenuItem ).toBeInTheDocument();

			expect( altItem ).toBeInTheDocument();
			expect( altMenuItem ).toBeInTheDocument();
		} );
	} );

	describe( 'wrapped panel items within custom components', () => {
		it( 'should render wrapped items correctly', () => {
			renderWrappedItemInPanel();

			const wrappers = screen.getAllByText( 'Wrapper' );
			const defaultItem = screen.getByText( 'Wrapped 1' );
			const altItem = screen.queryByText( 'Wrapped 2' );

			// Both wrappers should be rendered but only the panel item
			// displayed by default should be within the document.
			expect( wrappers.length ).toEqual( 2 );
			expect( defaultItem ).toBeInTheDocument();
			expect( altItem ).not.toBeInTheDocument();
		} );

		it( 'should render wrapped items within the menu', () => {
			renderWrappedItemInPanel();
			openDropdownMenu();

			const defaultItem = screen.getByText( 'Nested Control 1' );
			const defaultMenuItem = screen.getByRole( 'menuitemcheckbox', {
				name: 'Reset Nested Control 1',
				checked: true,
			} );

			const altItem = screen.getByText( 'Nested Control 2' );
			const altMenuItem = screen.getByRole( 'menuitemcheckbox', {
				name: 'Show Nested Control 2',
				checked: false,
			} );

			expect( defaultItem ).toBeInTheDocument();
			expect( defaultMenuItem ).toBeInTheDocument();

			expect( altItem ).toBeInTheDocument();
			expect( altMenuItem ).toBeInTheDocument();
		} );
	} );

	describe( 'rendering via SlotFills', () => {
		beforeEach( () => {
			jest.clearAllMocks();
		} );

		it( 'should maintain visual order of controls when toggled on and off', async () => {
			// Multiple fills are added to better simulate panel items being
			// injected from different locations.
			render(
				<SlotFillProvider>
					<ToolsPanelItems>
						<ToolsPanelItem { ...altControlProps }>
							<div>Item 1</div>
						</ToolsPanelItem>
					</ToolsPanelItems>
					<ToolsPanelItems>
						<ToolsPanelItem { ...controlProps }>
							<div>Item 2</div>
						</ToolsPanelItem>
					</ToolsPanelItems>
					<ToolsPanel { ...defaultProps }>
						<Slot />
					</ToolsPanel>
				</SlotFillProvider>
			);

			// Only the second item should be shown initially as it has a value.
			const firstItem = screen.queryByText( 'Item 1' );
			const secondItem = screen.getByText( 'Item 2' );

			expect( firstItem ).not.toBeInTheDocument();
			expect( secondItem ).toBeInTheDocument();

			// Toggle on the first item.
			await selectMenuItem( altControlProps.label );

			// The order of items should be as per their original source order.
			let items = screen.getAllByText( /Item [1-2]/ );

			expect( items ).toHaveLength( 2 );
			expect( items[ 0 ] ).toHaveTextContent( 'Item 1' );
			expect( items[ 1 ] ).toHaveTextContent( 'Item 2' );

			// Then toggle off both items.
			await selectMenuItem( controlProps.label );
			await selectMenuItem( altControlProps.label );

			// Toggle on controls again and ensure order remains.
			await selectMenuItem( controlProps.label );
			await selectMenuItem( altControlProps.label );

			items = screen.getAllByText( /Item [1-2]/ );

			expect( items ).toHaveLength( 2 );
			expect( items[ 0 ] ).toHaveTextContent( 'Item 1' );
			expect( items[ 1 ] ).toHaveTextContent( 'Item 2' );
		} );

		it( 'should not trigger callback when fill has not updated yet when panel has', () => {
			// Fill provided controls can update independently to the panel.
			// A `panelId` prop was added to both panels and items
			// so it could prevent erroneous registrations and calls to
			// `onDeselect` etc.
			//
			// See: https://github.com/WordPress/gutenberg/pull/35375
			//
			// This test simulates this issue by rendering an item within a
			// contrived `ToolsPanelContext` to reflect the changes the panel
			// item needs to protect against.
			const context = {
				panelId: '1234',
				menuItems: {
					default: {},
					optional: { [ altControlProps.label ]: true },
				},
				hasMenuItems: false,
				isResetting: false,
				shouldRenderPlaceholderItems: false,
				registerPanelItem: noop,
				deregisterPanelItem: noop,
				flagItemCustomization: noop,
				areAllOptionalControlsHidden: true,
			};

			// This initial render gives the tools panel item a chance to
			// set its internal state to reflect it was previously selected.
			// This later forms part of the condition used to determine if an
			// item is being deselected and thus call the onDeselect callback.
			const { rerender } = render(
				<ToolsPanelContext.Provider value={ context }>
					<ToolsPanelItem { ...altControlProps } panelId="1234">
						<div>Item</div>
					</ToolsPanelItem>
				</ToolsPanelContext.Provider>
			);

			// Simulate a change in panel separate to the rendering of fills.
			// e.g. a switch of block selection.
			context.panelId = '4321';
			context.menuItems.optional[ altControlProps.label ] = false;

			// Rerender the panel item and ensure that it skips any check
			// for deselection given it still belongs to a different panelId.
			rerender(
				<ToolsPanelContext.Provider value={ context }>
					<ToolsPanelItem { ...altControlProps } panelId="1234">
						<div>Item</div>
					</ToolsPanelItem>
				</ToolsPanelContext.Provider>
			);

			expect( altControlProps.onDeselect ).not.toHaveBeenCalled();
		} );

		it( 'should not contain orphaned menu items when panelId changes', async () => {
			// As fills and the panel can update independently this aims to
			// test that no orphaned items appear registered in the panel menu.
			//
			// See: https://github.com/WordPress/gutenberg/pull/34085
			const TestSlotFillPanel = ( { panelId } ) => (
				<SlotFillProvider>
					<ToolsPanelItems>
						<ToolsPanelItem { ...altControlProps } panelId="1234">
							<div>Item 1</div>
						</ToolsPanelItem>
					</ToolsPanelItems>
					<ToolsPanelItems>
						<ToolsPanelItem { ...controlProps } panelId="9999">
							<div>Item 2</div>
						</ToolsPanelItem>
					</ToolsPanelItems>
					<ToolsPanel { ...defaultProps } panelId={ panelId }>
						<Slot />
					</ToolsPanel>
				</SlotFillProvider>
			);

			const { rerender } = render( <TestSlotFillPanel panelId="1234" /> );
			await openDropdownMenu();

			// Only the item matching the panelId should have been registered
			// and appear in the panel menu.
			let altMenuItem = screen.getByRole( 'menuitemcheckbox', {
				name: 'Show Alt',
			} );
			let exampleMenuItem = screen.queryByRole( 'menuitemcheckbox', {
				name: 'Hide and reset Example',
			} );

			expect( altMenuItem ).toBeInTheDocument();
			expect( exampleMenuItem ).not.toBeInTheDocument();

			// Re-render the panel with different panelID simulating a block
			// selection change.
			rerender( <TestSlotFillPanel panelId="9999" /> );

			altMenuItem = screen.queryByRole( 'menuitemcheckbox', {
				name: 'Show Alt',
			} );
			exampleMenuItem = screen.getByRole( 'menuitemcheckbox', {
				name: 'Hide and reset Example',
			} );

			expect( altMenuItem ).not.toBeInTheDocument();
			expect( exampleMenuItem ).toBeInTheDocument();
		} );
	} );

	describe( 'panel header icon toggle', () => {
		const optionalControls = {
			attributes: { value: false },
			hasValue: jest.fn().mockImplementation( () => {
				return !! optionalControls.attributes.value;
			} ),
			label: 'Optional',
			onDeselect: jest.fn(),
			onSelect: jest.fn(),
			isShownByDefault: false,
		};

		it( 'should render appropriate icons for the dropdown menu', async () => {
			render(
				<ToolsPanel { ...defaultProps }>
					<ToolsPanelItem { ...optionalControls }>
						<div>Optional control</div>
					</ToolsPanelItem>
				</ToolsPanel>
			);

			// There are unactivated, optional menu items in the Tools Panel dropdown.
			const optionsHiddenIcon = screen.getByRole( 'button', {
				name: 'View and add options',
			} );

			expect( optionsHiddenIcon ).toBeInTheDocument();

			await selectMenuItem( optionalControls.label );

			// There are now NO unactivated, optional menu items in the Tools Panel dropdown.
			expect(
				screen.queryByRole( 'button', { name: 'View and add options' } )
			).not.toBeInTheDocument();

			const optionsDisplayedIcon = screen.getByRole( 'button', {
				name: 'View options',
			} );

			expect( optionsDisplayedIcon ).toBeInTheDocument();
		} );
	} );

	describe( 'first and last panel items', () => {
		it( 'should apply first/last classes to appropriate items', () => {
			const { container } = render(
				<SlotFillProvider>
					<ToolsPanelItems>
						<ToolsPanelItem { ...altControlProps }>
							<div>Item 1</div>
						</ToolsPanelItem>
						<ToolsPanelItem { ...controlProps }>
							<div>Item 2</div>
						</ToolsPanelItem>
					</ToolsPanelItems>
					<ToolsPanelItems>
						<ToolsPanelItem
							{ ...altControlProps }
							label="Item 3"
							isShownByDefault={ true }
						>
							<div>Item 3</div>
						</ToolsPanelItem>
					</ToolsPanelItems>
					<ToolsPanelItems>
						<ToolsPanelItem { ...altControlProps } label="Item 4">
							<div>Item 4</div>
						</ToolsPanelItem>
					</ToolsPanelItems>
					<ToolsPanel
						{ ...defaultProps }
						hasInnerWrapper={ true }
						shouldRenderPlaceholderItems={ true }
					>
						<Slot />
					</ToolsPanel>
				</SlotFillProvider>
			);

			const item2 = screen.getByText( 'Item 2' );
			const item3 = screen.getByText( 'Item 3' );

			expect( screen.queryByText( 'Item 1' ) ).not.toBeInTheDocument();
			expect( item2 ).toBeInTheDocument();
			expect( item3 ).toBeInTheDocument();
			expect( screen.queryByText( 'Item 4' ) ).not.toBeInTheDocument();

			expect( container ).toMatchSnapshot();
		} );
	} );
} );
