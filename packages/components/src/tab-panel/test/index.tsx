/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import TabPanel from '..';

const TABS = [
	{
		name: 'alpha',
		title: 'Alpha',
		className: 'alpha-class',
	},
	{
		name: 'beta',
		title: 'Beta',
		className: 'beta-class',
	},
	{
		name: 'gamma',
		title: 'Gamma',
		className: 'gamma-class',
	},
];

const getSelectedTab = () => screen.getByRole( 'tab', { selected: true } );

let originalGetClientRects: () => DOMRectList;

describe.each( [
	[ 'uncontrolled', TabPanel ],
	// The controlled component tests will be added once we certify the
	// uncontrolled component's behaviour on trunk.
	// [ 'controlled', TabPanel ],
] )( 'TabPanel %s', ( ...modeAndComponent ) => {
	const [ , Component ] = modeAndComponent;

	beforeAll( () => {
		originalGetClientRects = window.HTMLElement.prototype.getClientRects;
		// Mocking `getClientRects()` is necessary to pass a check performed by
		// the `focus.tabbable.find()` and by the `focus.focusable.find()` functions
		// from the `@wordpress/dom` package.
		// @ts-expect-error We're not trying to comply to the DOM spec, only mocking
		window.HTMLElement.prototype.getClientRects = function () {
			return [ 'trick-jsdom-into-having-size-for-element-rect' ];
		};
	} );

	afterAll( () => {
		window.HTMLElement.prototype.getClientRects = originalGetClientRects;
	} );

	describe( 'Without `initialTabName`', () => {
		it( 'should render first tab', async () => {
			const panelRenderFunction = jest.fn();

			render(
				<Component tabs={ TABS } children={ panelRenderFunction } />
			);

			expect( getSelectedTab() ).toHaveTextContent( 'Alpha' );
			expect(
				screen.getByRole( 'tabpanel', { name: 'Alpha' } )
			).toBeInTheDocument();
			expect( panelRenderFunction ).toHaveBeenLastCalledWith( TABS[ 0 ] );
		} );

		it( 'should fall back to first enabled tab if the active tab is removed', async () => {
			const mockOnSelect = jest.fn();
			const { rerender } = render(
				<Component
					tabs={ TABS }
					children={ () => undefined }
					onSelect={ mockOnSelect }
				/>
			);

			rerender(
				<Component
					tabs={ TABS.slice( 1 ) /* remove alpha */ }
					children={ () => undefined }
					onSelect={ mockOnSelect }
				/>
			);
			expect( getSelectedTab() ).toHaveTextContent( 'Beta' );
		} );
	} );

	describe( 'With `initialTabName`', () => {
		it( 'should render the tab set by initialTabName prop', () => {
			render(
				<Component
					initialTabName="beta"
					tabs={ TABS }
					children={ () => undefined }
				/>
			);

			expect( getSelectedTab() ).toHaveTextContent( 'Beta' );
		} );

		it( 'should not render a tab when initialTabName does not exist', () => {
			render(
				<Component
					initialTabName="does-not-exist"
					tabs={ TABS }
					children={ () => undefined }
				/>
			);

			// No tab should be rendered i.e. it doesn't fall back to first tab.
			expect(
				screen.queryByRole( 'tab', { selected: true } )
			).not.toBeInTheDocument();
		} );

		it( 'should not change tabs when initialTabName is changed', () => {
			const { rerender } = render(
				<Component
					initialTabName="beta"
					tabs={ TABS }
					children={ () => undefined }
				/>
			);

			rerender(
				<Component
					initialTabName="alpha"
					tabs={ TABS }
					children={ () => undefined }
				/>
			);

			expect( getSelectedTab() ).toHaveTextContent( 'Beta' );
		} );

		it( 'should fall back to initial tab if active tab is removed', async () => {
			const user = userEvent.setup();
			const mockOnSelect = jest.fn();
			const { rerender } = render(
				<Component
					initialTabName="gamma"
					tabs={ TABS }
					children={ () => undefined }
					onSelect={ mockOnSelect }
				/>
			);

			await user.click( screen.getByRole( 'tab', { name: 'Alpha' } ) );

			rerender(
				<Component
					initialTabName="gamma"
					tabs={ TABS.slice( 1 ) /* remove alpha */ }
					children={ () => undefined }
					onSelect={ mockOnSelect }
				/>
			);

			expect( getSelectedTab() ).toHaveTextContent( 'Gamma' );
		} );

		it( 'waits for the tab with the `initialTabName` to be present in the `tabs` array before selecting it', () => {
			const mockOnSelect = jest.fn();
			const { rerender } = render(
				<Component
					initialTabName="delta"
					tabs={ TABS }
					children={ () => undefined }
					onSelect={ mockOnSelect }
				/>
			);

			// There should be no selected tab yet.
			expect(
				screen.queryByRole( 'tab', { selected: true } )
			).not.toBeInTheDocument();

			rerender(
				<Component
					initialTabName="delta"
					tabs={ [
						{
							name: 'delta',
							title: 'Delta',
							className: 'delta-class',
						},
						...TABS,
					] }
					children={ () => undefined }
					onSelect={ mockOnSelect }
				/>
			);

			expect( getSelectedTab() ).toHaveTextContent( 'Delta' );
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'delta' );
		} );
	} );

	describe( 'Disabled Tab', () => {
		it( 'should disable the tab when `disabled` is `true`', async () => {
			const user = userEvent.setup();
			const mockOnSelect = jest.fn();

			render(
				<Component
					tabs={ [
						...TABS,
						{
							name: 'delta',
							title: 'Delta',
							className: 'delta-class',
							disabled: true,
						},
					] }
					children={ () => undefined }
					onSelect={ mockOnSelect }
				/>
			);

			expect(
				screen.getByRole( 'tab', { name: 'Delta' } )
			).toHaveAttribute( 'aria-disabled', 'true' );

			// onSelect gets called on the initial render.
			expect( mockOnSelect ).toHaveBeenCalledTimes( 1 );

			// onSelect should not be called since the disabled tab is
			// highlighted, but not selected.
			await user.keyboard( '[ArrowLeft]' );
			expect( mockOnSelect ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'should select first enabled tab when initial tab is disabled', () => {
			const mockOnSelect = jest.fn();

			render(
				<Component
					tabs={ TABS.map( ( tab ) => {
						if ( tab.name === 'gamma' ) {
							return tab;
						}
						return { ...tab, disabled: true };
					} ) }
					initialTabName="beta"
					children={ () => undefined }
					onSelect={ mockOnSelect }
				/>
			);

			// As alpha (first tab), and beta (the initial tab), are both
			// disabled the first enabled tab should be gamma.
			expect(
				screen.queryByRole( 'tab', { selected: true } )
			).toHaveTextContent( 'Gamma' );
		} );

		it( 'should select the first enabled tab when the selected tab becomes disabled', () => {
			const mockOnSelect = jest.fn();
			const { rerender } = render(
				<Component
					tabs={ TABS }
					children={ () => undefined }
					onSelect={ mockOnSelect }
				/>
			);

			expect( getSelectedTab() ).toHaveTextContent( 'Alpha' );

			rerender(
				<Component
					tabs={ TABS.map( ( tab ) => {
						if ( tab.name === 'alpha' ) {
							return { ...tab, disabled: true };
						}
						return tab;
					} ) }
					children={ () => undefined }
					onSelect={ mockOnSelect }
				/>
			);

			expect( getSelectedTab() ).toHaveTextContent( 'Beta' );
		} );
	} );

	describe( 'Tab Activation', () => {
		it( 'should render a tabpanel, and clicking should change tabs', async () => {
			const user = userEvent.setup();
			const panelRenderFunction = jest.fn();
			const mockOnSelect = jest.fn();

			render(
				<Component
					tabs={ TABS }
					children={ panelRenderFunction }
					onSelect={ mockOnSelect }
				/>
			);

			expect( getSelectedTab() ).toHaveTextContent( 'Alpha' );
			expect(
				screen.getByRole( 'tabpanel', { name: 'Alpha' } )
			).toBeInTheDocument();
			expect( panelRenderFunction ).toHaveBeenLastCalledWith( TABS[ 0 ] );
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'alpha' );

			await user.click( screen.getByRole( 'tab', { name: 'Beta' } ) );

			expect( getSelectedTab() ).toHaveTextContent( 'Beta' );
			expect(
				screen.getByRole( 'tabpanel', { name: 'Beta' } )
			).toBeInTheDocument();
			expect( panelRenderFunction ).toHaveBeenLastCalledWith( TABS[ 1 ] );
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'beta' );

			await user.click( screen.getByRole( 'tab', { name: 'Alpha' } ) );

			expect( getSelectedTab() ).toHaveTextContent( 'Alpha' );
			expect(
				screen.getByRole( 'tabpanel', { name: 'Alpha' } )
			).toBeInTheDocument();
			expect( panelRenderFunction ).toHaveBeenLastCalledWith( TABS[ 0 ] );
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'alpha' );
		} );

		it( 'defaults to automatic tab activation', async () => {
			const user = userEvent.setup();
			const mockOnSelect = jest.fn();

			render(
				<Component
					tabs={ TABS }
					children={ () => undefined }
					onSelect={ mockOnSelect }
				/>
			);

			// onSelect gets called on the initial render.
			expect( mockOnSelect ).toHaveBeenCalledTimes( 1 );

			// Click on Alpha. Make sure alpha is selected.
			await user.click( screen.getByRole( 'tab', { name: 'Alpha' } ) );
			expect( mockOnSelect ).toHaveBeenCalledTimes( 2 );
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'alpha' );

			// Navigate forward with arrow keys and make sure the Beta tab is
			// selected automatically.
			await user.keyboard( '[ArrowRight]' );
			expect( mockOnSelect ).toHaveBeenCalledTimes( 3 );
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'beta' );

			// Navigate forward with arrow keys. Make sure gamma (last tab) is
			// selected automatically.
			await user.keyboard( '[ArrowRight]' );
			expect( mockOnSelect ).toHaveBeenCalledTimes( 4 );
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'gamma' );

			// Navigate forward with arrow keys. Make sure Alpha (first tab) is
			// selected automatically.
			await user.keyboard( '[ArrowRight]' );
			expect( mockOnSelect ).toHaveBeenCalledTimes( 5 );
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'alpha' );

			// Navigate backwards with arrow keys. Make sure Gamma (last tab) is
			// selected automatically.
			await user.keyboard( '[ArrowLeft]' );
			expect( mockOnSelect ).toHaveBeenCalledTimes( 6 );
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'gamma' );
		} );

		it( 'switches to manual tab activation when the `selectOnMove` prop is set to `false`', async () => {
			const user = userEvent.setup();
			const mockOnSelect = jest.fn();

			render(
				<Component
					tabs={ TABS }
					children={ () => undefined }
					onSelect={ mockOnSelect }
					selectOnMove={ false }
				/>
			);

			// onSelect gets called on the initial render.
			expect( mockOnSelect ).toHaveBeenCalledTimes( 1 );

			// Click on Alpha and make sure it is selected.
			await user.click( screen.getByRole( 'tab', { name: 'Alpha' } ) );
			expect( mockOnSelect ).toHaveBeenCalledTimes( 2 );
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'alpha' );

			// Navigate forward with arrow keys. Make sure Beta is focused, but
			// that the tab selection happens only when pressing the spacebar
			// or enter key.
			await user.keyboard( '[ArrowRight]' );
			expect( mockOnSelect ).toHaveBeenCalledTimes( 2 );
			expect( screen.getByRole( 'tab', { name: 'Beta' } ) ).toHaveFocus();

			await user.keyboard( '[Enter]' );
			expect( mockOnSelect ).toHaveBeenCalledTimes( 3 );
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'beta' );

			// Navigate forward with arrow keys. Make sure Gamma (last tab) is
			// focused, but that tab selection happens only when pressing the
			// spacebar or enter key.
			await user.keyboard( '[ArrowRight]' );
			expect( mockOnSelect ).toHaveBeenCalledTimes( 3 );
			expect(
				screen.getByRole( 'tab', { name: 'Gamma' } )
			).toHaveFocus();

			await user.keyboard( '[Space]' );
			expect( mockOnSelect ).toHaveBeenCalledTimes( 4 );
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'gamma' );

			// No need to test the "wrap-around" behaviour, as it is being
			// tested in the "automatic tab activation" test above.
		} );
	} );

	describe( 'Tab Attributes', () => {
		it( "should apply the tab's `className` to the tab button", () => {
			render( <Component tabs={ TABS } children={ () => undefined } /> );

			expect( screen.getByRole( 'tab', { name: 'Alpha' } ) ).toHaveClass(
				'alpha-class'
			);
			expect( screen.getByRole( 'tab', { name: 'Beta' } ) ).toHaveClass(
				'beta-class'
			);
			expect( screen.getByRole( 'tab', { name: 'Gamma' } ) ).toHaveClass(
				'gamma-class'
			);
		} );

		it( 'should apply the `activeClass` to the selected tab', async () => {
			const user = userEvent.setup();
			const activeClass = 'my-active-tab';

			render(
				<Component
					activeClass={ activeClass }
					tabs={ TABS }
					children={ () => undefined }
				/>
			);

			expect( getSelectedTab() ).toHaveClass( activeClass );
			screen
				.getAllByRole( 'tab', { selected: false } )
				.forEach( ( unselectedTab ) => {
					expect( unselectedTab ).not.toHaveClass( activeClass );
				} );

			await user.click( screen.getByRole( 'tab', { name: 'Beta' } ) );

			expect( getSelectedTab() ).toHaveClass( activeClass );
			screen
				.getAllByRole( 'tab', { selected: false } )
				.forEach( ( unselectedTab ) => {
					expect( unselectedTab ).not.toHaveClass( activeClass );
				} );
		} );
	} );
} );
