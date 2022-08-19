/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import TabPanel from '../';

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

		render(
			<TabPanel
				tabs={ TABS }
				children={ ( tab ) => `${ tab.name } panel` }
			/>
		);

		expect( getSelectedTab() ).toHaveTextContent( 'Alpha' );
		expect( screen.getByRole( 'tabpanel' ) ).toHaveTextContent(
			'alpha panel'
		);

		await user.click( screen.getByRole( 'tab', { name: 'Beta' } ) );

		expect( getSelectedTab() ).toHaveTextContent( 'Beta' );
		expect( screen.getByRole( 'tabpanel' ) ).toHaveTextContent(
			'beta panel'
		);

		await user.click( screen.getByRole( 'tab', { name: 'Gamma' } ) );

		expect( getSelectedTab() ).toHaveTextContent( 'Gamma' );
		expect( screen.getByRole( 'tabpanel' ) ).toHaveTextContent(
			'gamma panel'
		);

		await user.click(
			screen.getByRole( 'tab', {
				name: 'Alpha',
			} )
		);

		expect( getSelectedTab() ).toHaveTextContent( 'Alpha' );
		expect( screen.getByRole( 'tabpanel' ) ).toHaveTextContent(
			'alpha panel'
		);
	} );

	it( 'should render with a tab initially selected by prop initialTabIndex', () => {
		render(
			<TabPanel
				initialTabName="beta"
				tabs={ TABS }
				children={ () => {} }
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
				children={ () => {} }
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
		render( <TabPanel tabs={ TABS } children={ () => {} } /> );

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
} );
