/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import TabPanel from '..';

const setupUser = () =>
	userEvent.setup( {
		advanceTimers: jest.advanceTimersByTime,
	} );

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

describe( 'TabPanel', () => {
	it( 'should render a tabpanel, and clicking should change tabs', async () => {
		const user = setupUser();
		const panelRenderFunction = jest.fn();
		const mockOnSelect = jest.fn();

		render(
			<TabPanel
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

	it( 'should render with a tab initially selected by prop initialTabIndex', () => {
		render(
			<TabPanel
				initialTabName="beta"
				tabs={ TABS }
				children={ () => undefined }
			/>
		);
		const selectedTab = screen.getByRole( 'tab', { selected: true } );
		expect( selectedTab ).toHaveTextContent( 'Beta' );
	} );

	it( 'should apply the `activeClass` to the selected tab', async () => {
		const user = setupUser();
		const activeClass = 'my-active-tab';

		render(
			<TabPanel
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

	it( "should apply the tab's `className` to the tab button", () => {
		render( <TabPanel tabs={ TABS } children={ () => undefined } /> );

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

	it( 'should select `initialTabname` if defined', () => {
		const mockOnSelect = jest.fn();

		render(
			<TabPanel
				tabs={ TABS }
				initialTabName="beta"
				children={ () => undefined }
				onSelect={ mockOnSelect }
			/>
		);
		expect( getSelectedTab() ).toHaveTextContent( 'Beta' );
		expect( mockOnSelect ).toHaveBeenLastCalledWith( 'beta' );
	} );

	describe( 'fallbacks when new tab list invalidates current selection', () => {
		it( 'should select `initialTabName` if defined', async () => {
			const user = setupUser();
			const mockOnSelect = jest.fn();

			const { rerender } = render(
				<TabPanel
					tabs={ TABS }
					initialTabName="gamma"
					children={ () => undefined }
					onSelect={ mockOnSelect }
				/>
			);
			await user.click( screen.getByRole( 'tab', { name: 'Alpha' } ) );

			rerender(
				<TabPanel
					tabs={ TABS.slice( 1 ) /* remove alpha */ }
					initialTabName="gamma"
					children={ () => undefined }
					onSelect={ mockOnSelect }
				/>
			);
			expect( getSelectedTab() ).toHaveTextContent( 'Gamma' );
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'gamma' );
		} );

		it( 'should select first tab if `initialTabName` not defined', async () => {
			const user = setupUser();
			const mockOnSelect = jest.fn();

			const { rerender } = render(
				<TabPanel
					tabs={ TABS }
					children={ () => undefined }
					onSelect={ mockOnSelect }
				/>
			);
			await user.click( screen.getByRole( 'tab', { name: 'Alpha' } ) );

			rerender(
				<TabPanel
					tabs={ TABS.slice( 1 ) /* remove alpha */ }
					children={ () => undefined }
					onSelect={ mockOnSelect }
				/>
			);
			expect( getSelectedTab() ).toHaveTextContent( 'Beta' );
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'beta' );
		} );
	} );
} );
