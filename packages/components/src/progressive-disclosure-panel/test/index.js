/**
 * External dependencies
 */
import { render, screen, fireEvent } from '@testing-library/react';

/**
 * Internal dependencies
 */
import ProgressiveDisclosurePanel from '../';
import PanelItem from '../item';

const resetAll = jest.fn();

// Default props for the progressive disclosure panel.
const defaultProps = {
	label: 'Display options',
	title: 'Panel title',
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

// Attempts to find the progressive disclosure panel via its CSS class.
const getPanel = ( container ) =>
	container.querySelector( '.components-progressive-disclosure-panel' );

// Renders a default progressive disclosure panel including children that are
// not to be represented within the panel's menu.
const renderPanel = () => {
	return render(
		<ProgressiveDisclosurePanel { ...defaultProps }>
			{ false && <div>Hidden</div> }
			<PanelItem { ...controlProps }>
				<div>Example control</div>
			</PanelItem>
			<PanelItem { ...altControlProps }>
				<div>Alt control</div>
			</PanelItem>
			<span>Visible</span>
		</ProgressiveDisclosurePanel>
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

describe( 'ProgressiveDisclosurePanel', () => {
	describe( 'basic rendering', () => {
		it( 'should not render when no children provided', () => {
			const { container } = render(
				<ProgressiveDisclosurePanel { ...defaultProps } />
			);

			expect( getPanel( container ) ).not.toBeInTheDocument();
		} );

		it( 'should not render when only child has been filtered out', () => {
			// This covers case where children prop is not an array.
			const { container } = render(
				<ProgressiveDisclosurePanel { ...defaultProps }>
					{ false && <PanelItem>Should not show</PanelItem> }
				</ProgressiveDisclosurePanel>
			);

			expect( getPanel( container ) ).not.toBeInTheDocument();
		} );

		it( 'should not render when there are no progressive panel items', () => {
			const { container } = render(
				<ProgressiveDisclosurePanel { ...defaultProps }>
					{ false && <PanelItem>Should not show</PanelItem> }
					{ false && <PanelItem>Not shown either</PanelItem> }
					<span>Visible but insignificant</span>
				</ProgressiveDisclosurePanel>
			);

			expect( getPanel( container ) ).not.toBeInTheDocument();
		} );

		it( 'should render panel when at least one panel item as child', () => {
			const { container } = renderPanel();

			expect( getPanel( container ) ).toBeInTheDocument();
		} );

		it( 'should render non panel item child', () => {
			renderPanel();

			const nonPanelItem = screen.queryByText( 'Visible' );

			expect( nonPanelItem ).toBeInTheDocument();
		} );

		it( 'should render child flagged as default control even without value', () => {
			render(
				<ProgressiveDisclosurePanel { ...defaultProps }>
					<PanelItem { ...controlProps }>
						<div>Example control</div>
					</PanelItem>
					<PanelItem { ...altControlProps } isShownByDefault={ true }>
						<div>Alt control</div>
					</PanelItem>
				</ProgressiveDisclosurePanel>
			);

			const altControl = screen.getByText( 'Alt control' );

			expect( altControl ).toBeInTheDocument();
		} );

		it( 'should render display options menu', () => {
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

		it( 'should render display options menu items correctly', async () => {
			renderPanel();
			openDropdownMenu();

			const menuItems = await screen.findAllByRole( 'menuitemcheckbox' );

			expect( menuItems.length ).toEqual( 2 );
			expect( menuItems[ 0 ] ).toHaveAttribute( 'aria-checked', 'true' );
			expect( menuItems[ 1 ] ).toHaveAttribute( 'aria-checked', 'false' );
		} );

		it( 'should render panel title', () => {
			renderPanel();
			const title = screen.getByText( defaultProps.title );

			expect( title ).toBeInTheDocument();
		} );
	} );

	describe( 'conditional rendering of children', () => {
		it( 'should render child when it has a value', () => {
			renderPanel();

			const exampleControl = screen.getByText( 'Example control' );
			const altControl = screen.queryByText( 'Alt control' );

			expect( exampleControl ).toBeInTheDocument();
			expect( altControl ).not.toBeInTheDocument();
		} );

		it( 'should render child when corresponding menu item is selected', async () => {
			renderPanel();
			await selectMenuItem( altControlProps.label );
			const control = await screen.findByText( 'Alt control' );

			expect( control ).toBeInTheDocument();
		} );

		it( 'should prevent child rendering when toggled off via menu item', async () => {
			renderPanel();
			await selectMenuItem( controlProps.label );
			const control = screen.queryByText( 'Example control' );

			expect( control ).not.toBeInTheDocument();
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
		} );
	} );
} );
