/**
 * External dependencies
 */
import { render, screen, fireEvent } from '@testing-library/react';

/**
 * Internal dependencies
 */
import BlockSupportPanel from '../';

// Used to represent the block support provided controls.
const MockControl = ( { children } ) => <div>{ children }</div>;

const resetAll = jest.fn();
const hasValue = jest.fn().mockImplementation( ( props ) => {
	// Use fudged attribute to determine existence of value for testing.
	return props.attributes.value;
} );

// Default props for the block supports panel.
const defaultProps = {
	label: 'Display options',
	title: 'Panel title',
	resetAll,
};

// Default props for enabled block supports control to be rendered within panel.
const controlProps = {
	attributes: { value: true },
	hasValue,
	label: 'Example',
	reset: jest.fn().mockImplementation( () => {
		controlProps.attributes.value = undefined;
	} ),
};

// Default props without a value for alternate block supports control to be
// rendered within the panel.
const altControlProps = {
	attributes: { value: false },
	hasValue,
	label: 'Alt',
	reset: jest.fn(),
};

// Attempts to find the block supports panel via its CSS class.
const getPanel = ( container ) =>
	container.querySelector( '.components-block-support-panel' );

// Renders a default block supports panel including a control that simulates
// block support being disabled for that particular control.
const renderPanel = () => {
	return render(
		<BlockSupportPanel { ...defaultProps }>
			{ false && <div>Hidden</div> }
			<MockControl { ...controlProps }>Example control</MockControl>
			<MockControl { ...altControlProps }>Alt control</MockControl>
		</BlockSupportPanel>
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

describe( 'BlockSupportPanel', () => {
	describe( 'basic rendering', () => {
		it( 'should not render when no children provided', () => {
			const { container } = render(
				<BlockSupportPanel { ...defaultProps } />
			);

			expect( getPanel( container ) ).not.toBeInTheDocument();
		} );

		it( 'should not render when only child has been filtered out', () => {
			// This covers case where children prop is not an array.
			const { container } = render(
				<BlockSupportPanel { ...defaultProps }>
					{ false && <MockControl>Should not show</MockControl> }
				</BlockSupportPanel>
			);

			expect( getPanel( container ) ).not.toBeInTheDocument();
		} );

		it( 'should not render when all children have been filtered out', () => {
			const { container } = render(
				<BlockSupportPanel { ...defaultProps }>
					{ false && <MockControl>Should not show</MockControl> }
					{ false && <MockControl>Not shown either</MockControl> }
				</BlockSupportPanel>
			);

			expect( getPanel( container ) ).not.toBeInTheDocument();
		} );

		it( 'should render panel when at least one child', () => {
			const { container } = renderPanel();

			expect( getPanel( container ) ).toBeInTheDocument();
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

	describe( 'conditional rendering of inner controls', () => {
		it( 'should render child control when it has a value', () => {
			renderPanel();

			const exampleControl = screen.getByText( 'Example control' );
			const altControl = screen.queryByText( 'Alt control' );

			expect( exampleControl ).toBeInTheDocument();
			expect( altControl ).not.toBeInTheDocument();
		} );

		it( 'should render child control when corresponding menu is selected', async () => {
			renderPanel();
			await selectMenuItem( altControlProps.label );
			const control = await screen.findByText( 'Alt control' );

			expect( control ).toBeInTheDocument();
		} );

		it( 'should prevent child rendering when toggled off via menu', async () => {
			renderPanel();
			await selectMenuItem( controlProps.label );
			const control = screen.queryByText( 'Example control' );

			expect( control ).not.toBeInTheDocument();
		} );
	} );

	describe( 'reset callbacks on menu item selection', () => {
		beforeEach( () => {
			jest.clearAllMocks();
			controlProps.attributes.value = true;
		} );

		it( 'should call reset callback when menu item is toggled off', async () => {
			renderPanel();
			await selectMenuItem( controlProps.label );

			expect( controlProps.reset ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'should not call reset callback when menu item is toggled on', async () => {
			renderPanel();
			await selectMenuItem( altControlProps.label );

			expect( altControlProps.reset ).not.toHaveBeenCalled();
		} );

		it( 'should call resetAll callback when its menu item is selected', async () => {
			renderPanel();
			await selectMenuItem( 'Reset all' );

			expect( resetAll ).toHaveBeenCalledTimes( 1 );
		} );
	} );
} );
