/**
 * External dependencies
 */
import { render, screen, fireEvent } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { ToolsPanel, ToolsPanelItem } from '../';

const resetAll = jest.fn();

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
		<div className="wrapped-panel-item-container">
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

// Attempts to find the tools panel via its CSS class.
const getPanel = ( container ) =>
	container.querySelector( '.components-tools-panel' );

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

// Helper to find the menu button and simulate a user click.
const openDropdownMenu = () => {
	const menuButton = screen.getByLabelText( defaultProps.label );
	fireEvent.click( menuButton );
};

// Opens dropdown then selects the menu item by label before simulating a click.
const selectMenuItem = async ( label ) => {
	openDropdownMenu();
	const menuItem = await screen.findByText( label );
	fireEvent.click( menuItem );
};

describe( 'ToolsPanel', () => {
	describe( 'basic rendering', () => {
		it( 'should render panel', () => {
			const { container } = renderPanel();

			expect( getPanel( container ) ).toBeInTheDocument();
		} );

		it( 'should render non panel item child', () => {
			renderPanel();

			const nonPanelItem = screen.queryByText( 'Visible' );

			expect( nonPanelItem ).toBeInTheDocument();
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

			const menuButton = screen.getByLabelText( defaultProps.label );
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
			const resetControl = screen.queryByText( 'Default control' );

			expect( resetControl ).toBeInTheDocument();
		} );

		it( 'should render appropriate menu groups', async () => {
			const { container } = render(
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

			const menuGroups = container.querySelectorAll(
				'.components-menu-group'
			);

			// Groups should be: default controls, optional controls & reset all.
			expect( menuGroups.length ).toEqual( 3 );
		} );
	} );

	describe( 'callbacks on menu item selection', () => {
		beforeEach( () => {
			jest.clearAllMocks();
			controlProps.attributes.value = true;
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
			const defaultMenuItem = defaultItem.parentNode;

			const altItem = screen.getByText( 'Nested Control 2' );
			const altMenuItem = altItem.parentNode;

			expect( defaultItem ).toBeInTheDocument();
			expect( defaultMenuItem ).toHaveAttribute( 'aria-checked', 'true' );

			expect( altItem ).toBeInTheDocument();
			expect( altMenuItem ).toHaveAttribute( 'aria-checked', 'false' );
		} );
	} );

	describe( 'wrapped panel items within custom components', () => {
		it( 'should render wrapped items correctly', () => {
			const { container } = renderWrappedItemInPanel();

			const wrappers = container.querySelectorAll(
				'.wrapped-panel-item-container'
			);
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
			const defaultMenuItem = defaultItem.parentNode;

			const altItem = screen.getByText( 'Nested Control 2' );
			const altMenuItem = altItem.parentNode;

			expect( defaultItem ).toBeInTheDocument();
			expect( defaultMenuItem ).toHaveAttribute( 'aria-checked', 'true' );

			expect( altItem ).toBeInTheDocument();
			expect( altMenuItem ).toHaveAttribute( 'aria-checked', 'false' );
		} );
	} );
} );
