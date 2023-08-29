/**
 * External dependencies
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { wordpress, category, media } from '@wordpress/icons';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Tabs from '..';
import Popover from '../../popover';
import { Provider as SlotFillProvider } from '../../slot-fill';
import type { TabsProps } from '../types';

const UncontrolledTabs = ( props?: Omit< TabsProps, 'children' | 'tabs' > ) => {
	return (
		// Force `selectedTabId` to `undefined` to maintain uncontrolled mode
		<Tabs { ...props } selectedTabId={ undefined }>
			<Tabs.TabList>
				{ TABS.map( ( tab ) => (
					<Tabs.Tab
						key={ tab.id }
						id={ tab.id }
						title={ tab.title }
						className={ tab.tab.className }
					>
						{ tab.title }
					</Tabs.Tab>
				) ) }
			</Tabs.TabList>
			{ TABS.map( ( tab ) => (
				<Tabs.TabPanel key={ tab.id } id={ tab.id }>
					{ tab.content }
				</Tabs.TabPanel>
			) ) }
		</Tabs>
	);
};

const ControlledTabs = ( props: TabsProps ) => {
	const [ selectedTabId, setSelectedTabId ] = useState<
		string | undefined | null
	>( props?.selectedTabId );

	return (
		// @ts-expect-error
		<Tabs
			{ ...props }
			selectedTabId={ selectedTabId }
			onSelect={ ( selectedId ) => {
				setSelectedTabId( selectedId );
				props?.onSelect?.( selectedId );
			} }
		>
			{ props.children }
		</Tabs>
	);
};

const TABS = [
	{
		id: 'alpha',
		title: 'Alpha',
		content: 'Selected tab: Alpha',
		tab: { className: 'alpha-class', icon: wordpress },
	},
	{
		id: 'beta',
		title: 'Beta',
		content: 'Selected tab: Beta',
		tab: { className: 'beta-class', icon: category },
	},
	{
		id: 'gamma',
		title: 'Gamma',
		content: 'Selected tab: Gamma',
		tab: { className: 'gamma-class', icon: media },
	},
];

const TABS_WITH_DELTA = [
	...TABS,
	{
		id: 'delta',
		title: 'Delta',
		content: 'Selected tab: Delta',
		tab: { className: 'delta-class', icon: media },
	},
];

const getSelectedTab = async () =>
	await screen.findByRole( 'tab', { selected: true } );

let originalGetClientRects: () => DOMRectList;

describe( 'Tabs', () => {
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

	describe( 'Accessibility and semantics', () => {
		it( 'should use the correct aria attributes', async () => {
			render( <UncontrolledTabs /> );

			const tabList = screen.getByRole( 'tablist' );
			const allTabs = screen.getAllByRole( 'tab' );
			const selectedTabPanel = await screen.findByRole( 'tabpanel' );

			expect( tabList ).toBeVisible();
			expect( tabList ).toHaveAttribute(
				'aria-orientation',
				'horizontal'
			);

			expect( allTabs ).toHaveLength( TABS.length );

			// The selected `tab` aria-controls the active `tabpanel`,
			// which is `aria-labelledby` the selected `tab`.
			expect( selectedTabPanel ).toBeVisible();
			expect( allTabs[ 0 ] ).toHaveAttribute(
				'aria-controls',
				selectedTabPanel.getAttribute( 'id' )
			);
			expect( selectedTabPanel ).toHaveAttribute(
				'aria-labelledby',
				allTabs[ 0 ].getAttribute( 'id' )
			);
		} );

		it( 'should display a tooltip when hovering tabs provided with an icon', async () => {
			const user = userEvent.setup();

			render(
				// In order for the tooltip to display properly, there needs to be
				// `Popover.Slot` in which the `Popover` renders outside of the
				// `Tabs` component, otherwise the tooltip renders inline.
				<SlotFillProvider>
					<Tabs>
						<Tabs.TabList>
							{ TABS.map( ( tab ) => (
								<Tabs.Tab
									key={ tab.id }
									id={ tab.id }
									title={ tab.title }
									className={ tab.tab.className }
									icon={ tab.tab.icon }
								></Tabs.Tab>
							) ) }
						</Tabs.TabList>
						{ TABS.map( ( tab ) => (
							<Tabs.TabPanel key={ tab.id } id={ tab.id }>
								{ tab.content }
							</Tabs.TabPanel>
						) ) }
					</Tabs>
					{ /* @ts-expect-error The 'Slot' component hasn't been typed yet. */ }
					<Popover.Slot />
				</SlotFillProvider>
			);
			const allTabs = screen.getAllByRole( 'tab' );

			for ( let i = 0; i < allTabs.length; i++ ) {
				expect(
					screen.queryByText( TABS[ i ].title )
				).not.toBeInTheDocument();

				await user.hover( allTabs[ i ] );

				await waitFor( () =>
					expect( screen.getByText( TABS[ i ].title ) ).toBeVisible()
				);

				await user.unhover( allTabs[ i ] );
			}
		} );

		it( 'should display a tooltip when moving the selection via the keyboard on tabs provided with an icon', async () => {
			const user = userEvent.setup();

			const mockOnSelect = jest.fn();

			render(
				// In order for the tooltip to display properly, there needs to be
				// `Popover.Slot` in which the `Popover` renders outside of the
				// `Tabs` component, otherwise the tooltip renders inline.
				<SlotFillProvider>
					<Tabs onSelect={ mockOnSelect }>
						<Tabs.TabList>
							{ TABS.map( ( tab ) => (
								<Tabs.Tab
									key={ tab.id }
									id={ tab.id }
									title={ tab.title }
									className={ tab.tab.className }
									icon={ tab.tab.icon }
								/>
							) ) }
						</Tabs.TabList>
						{ TABS.map( ( tab ) => (
							<Tabs.TabPanel key={ tab.id } id={ tab.id }>
								{ tab.content }
							</Tabs.TabPanel>
						) ) }
					</Tabs>
					{ /* @ts-expect-error The 'Slot' component hasn't been typed yet. */ }
					<Popover.Slot />
				</SlotFillProvider>
			);

			expect( await getSelectedTab() ).not.toHaveTextContent( 'Alpha' );
			expect( mockOnSelect ).toHaveBeenCalledTimes( 1 );
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'alpha' );
			expect( await getSelectedTab() ).not.toHaveFocus();

			// Tab to focus the tablist. Make sure alpha is focused, and that the
			// corresponding tooltip is shown.
			expect( screen.queryByText( 'Alpha' ) ).not.toBeInTheDocument();
			await user.keyboard( '[Tab]' );
			expect( mockOnSelect ).toHaveBeenCalledTimes( 1 );
			expect( screen.getByText( 'Alpha' ) ).toBeInTheDocument();
			expect( await getSelectedTab() ).toHaveFocus();

			// Move selection with arrow keys. Make sure beta is focused, and that
			// the corresponding tooltip is shown.
			expect( screen.queryByText( 'Beta' ) ).not.toBeInTheDocument();
			await user.keyboard( '[ArrowRight]' );
			expect( mockOnSelect ).toHaveBeenCalledTimes( 2 );
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'beta' );
			expect( screen.getByText( 'Beta' ) ).toBeInTheDocument();
			expect( await getSelectedTab() ).toHaveFocus();

			// Move selection with arrow keys. Make sure gamma is focused, and that
			// the corresponding tooltip is shown.
			expect( screen.queryByText( 'Gamma' ) ).not.toBeInTheDocument();
			await user.keyboard( '[ArrowRight]' );
			expect( mockOnSelect ).toHaveBeenCalledTimes( 3 );
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'gamma' );
			expect( screen.getByText( 'Gamma' ) ).toBeInTheDocument();
			expect( await getSelectedTab() ).toHaveFocus();

			// Move selection with arrow keys. Make sure beta is focused, and that
			// the corresponding tooltip is shown.
			expect( screen.queryByText( 'Beta' ) ).not.toBeInTheDocument();
			await user.keyboard( '[ArrowLeft]' );
			expect( mockOnSelect ).toHaveBeenCalledTimes( 4 );
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'beta' );
			expect( screen.getByText( 'Beta' ) ).toBeInTheDocument();
			expect( await getSelectedTab() ).toHaveFocus();
		} );
	} );
	describe( 'Tab Attributes', () => {
		it( "should apply the tab's `className` to the tab button", async () => {
			render( <UncontrolledTabs /> );

			expect(
				await screen.findByRole( 'tab', { name: 'Alpha' } )
			).toHaveClass( 'alpha-class' );
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

			render( <UncontrolledTabs activeClass={ activeClass } /> );

			// Make sure that only the selected tab has the active class
			expect( await getSelectedTab() ).toHaveTextContent( 'Alpha' );
			expect( await getSelectedTab() ).toHaveClass( activeClass );
			screen
				.getAllByRole( 'tab', { selected: false } )
				.forEach( ( unselectedTab ) => {
					expect( unselectedTab ).not.toHaveClass( activeClass );
				} );

			// Click the 'Beta' tab
			await user.click( screen.getByRole( 'tab', { name: 'Beta' } ) );

			// Make sure that only the selected tab has the active class
			expect( await getSelectedTab() ).toHaveTextContent( 'Beta' );
			expect( await getSelectedTab() ).toHaveClass( activeClass );
			screen
				.getAllByRole( 'tab', { selected: false } )
				.forEach( ( unselectedTab ) => {
					expect( unselectedTab ).not.toHaveClass( activeClass );
				} );
		} );
	} );

	describe( 'Tab Activation', () => {
		it( 'defaults to automatic tab activation (pointer clicks)', async () => {
			const user = userEvent.setup();
			const mockOnSelect = jest.fn();

			render( <UncontrolledTabs onSelect={ mockOnSelect } /> );

			// Alpha is the initially selected tab
			expect( await getSelectedTab() ).toHaveTextContent( 'Alpha' );
			expect(
				await screen.findByRole( 'tabpanel', { name: 'Alpha' } )
			).toBeInTheDocument();
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'alpha' );

			// Click on Beta, make sure beta is the selected tab
			await user.click( screen.getByRole( 'tab', { name: 'Beta' } ) );

			expect( await getSelectedTab() ).toHaveTextContent( 'Beta' );
			expect(
				screen.getByRole( 'tabpanel', { name: 'Beta' } )
			).toBeInTheDocument();
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'beta' );

			// Click on Alpha, make sure beta is the selected tab
			await user.click( screen.getByRole( 'tab', { name: 'Alpha' } ) );

			expect( await getSelectedTab() ).toHaveTextContent( 'Alpha' );
			expect(
				screen.getByRole( 'tabpanel', { name: 'Alpha' } )
			).toBeInTheDocument();
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'alpha' );
		} );

		it( 'defaults to automatic tab activation (arrow keys)', async () => {
			const user = userEvent.setup();
			const mockOnSelect = jest.fn();

			render( <UncontrolledTabs onSelect={ mockOnSelect } /> );

			// onSelect gets called on the initial render.
			expect( mockOnSelect ).toHaveBeenCalledTimes( 1 );

			// Tab to focus the tablist. Make sure alpha is focused.
			expect( await getSelectedTab() ).toHaveTextContent( 'Alpha' );
			expect( await getSelectedTab() ).not.toHaveFocus();
			await user.keyboard( '[Tab]' );
			expect( await getSelectedTab() ).toHaveFocus();

			// Navigate forward with arrow keys and make sure the Beta tab is
			// selected automatically.
			await user.keyboard( '[ArrowRight]' );
			expect( await getSelectedTab() ).toHaveTextContent( 'Beta' );
			expect( await getSelectedTab() ).toHaveFocus();
			expect( mockOnSelect ).toHaveBeenCalledTimes( 2 );
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'beta' );

			// Navigate backwards with arrow keys. Make sure alpha is
			// selected automatically.
			await user.keyboard( '[ArrowLeft]' );
			expect( await getSelectedTab() ).toHaveTextContent( 'Alpha' );
			expect( await getSelectedTab() ).toHaveFocus();
			expect( mockOnSelect ).toHaveBeenCalledTimes( 3 );
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'alpha' );
		} );

		it( 'wraps around the last/first tab when using arrow keys', async () => {
			const user = userEvent.setup();
			const mockOnSelect = jest.fn();

			render( <UncontrolledTabs onSelect={ mockOnSelect } /> );

			// onSelect gets called on the initial render.
			expect( mockOnSelect ).toHaveBeenCalledTimes( 1 );

			// Tab to focus the tablist. Make sure Alpha is focused.
			expect( await getSelectedTab() ).toHaveTextContent( 'Alpha' );
			expect( await getSelectedTab() ).not.toHaveFocus();
			await user.keyboard( '[Tab]' );
			expect( await getSelectedTab() ).toHaveFocus();

			// Navigate backwards with arrow keys and make sure that the Gamma tab
			// (the last tab) is selected automatically.
			await user.keyboard( '[ArrowLeft]' );
			expect( await getSelectedTab() ).toHaveTextContent( 'Gamma' );
			expect( await getSelectedTab() ).toHaveFocus();
			expect( mockOnSelect ).toHaveBeenCalledTimes( 2 );
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'gamma' );

			// Navigate forward with arrow keys. Make sure alpha (the first tab) is
			// selected automatically.
			await user.keyboard( '[ArrowRight]' );
			expect( await getSelectedTab() ).toHaveTextContent( 'Alpha' );
			expect( await getSelectedTab() ).toHaveFocus();
			expect( mockOnSelect ).toHaveBeenCalledTimes( 3 );
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'alpha' );
		} );

		it( 'should not move tab selection when pressing the up/down arrow keys, unless the orientation is changed to `vertical`', async () => {
			const user = userEvent.setup();
			const mockOnSelect = jest.fn();

			const { rerender } = render(
				<UncontrolledTabs onSelect={ mockOnSelect } />
			);

			// onSelect gets called on the initial render.
			expect( mockOnSelect ).toHaveBeenCalledTimes( 1 );

			// Tab to focus the tablist. Make sure alpha is focused.
			expect( await getSelectedTab() ).toHaveTextContent( 'Alpha' );
			expect( await getSelectedTab() ).not.toHaveFocus();
			await user.keyboard( '[Tab]' );
			expect( await getSelectedTab() ).toHaveFocus();

			// Press the arrow up key, nothing happens.
			await user.keyboard( '[ArrowUp]' );
			expect( await getSelectedTab() ).toHaveTextContent( 'Alpha' );
			expect( await getSelectedTab() ).toHaveFocus();
			expect( mockOnSelect ).toHaveBeenCalledTimes( 1 );
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'alpha' );

			// Press the arrow down key, nothing happens
			await user.keyboard( '[ArrowDown]' );
			expect( await getSelectedTab() ).toHaveTextContent( 'Alpha' );
			expect( await getSelectedTab() ).toHaveFocus();
			expect( mockOnSelect ).toHaveBeenCalledTimes( 1 );
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'alpha' );

			// Change orientation to `vertical`. When the orientation is vertical,
			// left/right arrow keys are replaced by up/down arrow keys.
			rerender(
				<UncontrolledTabs
					onSelect={ mockOnSelect }
					orientation="vertical"
				/>
			);

			expect( screen.getByRole( 'tablist' ) ).toHaveAttribute(
				'aria-orientation',
				'vertical'
			);

			// Make sure alpha is still focused.
			expect( await getSelectedTab() ).toHaveTextContent( 'Alpha' );
			expect( await getSelectedTab() ).toHaveFocus();

			// Navigate forward with arrow keys and make sure the Beta tab is
			// selected automatically.
			await user.keyboard( '[ArrowDown]' );
			expect( await getSelectedTab() ).toHaveTextContent( 'Beta' );
			expect( await getSelectedTab() ).toHaveFocus();
			expect( mockOnSelect ).toHaveBeenCalledTimes( 2 );
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'beta' );

			// Navigate backwards with arrow keys. Make sure alpha is
			// selected automatically.
			await user.keyboard( '[ArrowUp]' );
			expect( await getSelectedTab() ).toHaveTextContent( 'Alpha' );
			expect( await getSelectedTab() ).toHaveFocus();
			expect( mockOnSelect ).toHaveBeenCalledTimes( 3 );
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'alpha' );

			// Navigate backwards with arrow keys. Make sure alpha is
			// selected automatically.
			await user.keyboard( '[ArrowUp]' );
			expect( await getSelectedTab() ).toHaveTextContent( 'Gamma' );
			expect( await getSelectedTab() ).toHaveFocus();
			expect( mockOnSelect ).toHaveBeenCalledTimes( 4 );
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'gamma' );

			// Navigate backwards with arrow keys. Make sure alpha is
			// selected automatically.
			await user.keyboard( '[ArrowDown]' );
			expect( await getSelectedTab() ).toHaveTextContent( 'Alpha' );
			expect( await getSelectedTab() ).toHaveFocus();
			expect( mockOnSelect ).toHaveBeenCalledTimes( 5 );
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'alpha' );
		} );

		it( 'should move focus on a tab even if disabled with arrow key, but not with pointer clicks', async () => {
			const user = userEvent.setup();
			const mockOnSelect = jest.fn();

			render(
				<Tabs onSelect={ mockOnSelect }>
					<Tabs.TabList>
						{ TABS_WITH_DELTA.map( ( tab ) => (
							<Tabs.Tab
								key={ tab.id }
								id={ tab.id }
								title={ tab.title }
								className={ tab.tab.className }
								// Disable delta
								disabled={ tab.id === 'delta' }
							>
								{ tab.title }
							</Tabs.Tab>
						) ) }
					</Tabs.TabList>
					{ TABS_WITH_DELTA.map( ( tab ) => (
						<Tabs.TabPanel key={ tab.id } id={ tab.id }>
							{ tab.content }
						</Tabs.TabPanel>
					) ) }
				</Tabs>
			);

			// onSelect gets called on the initial render.
			expect( mockOnSelect ).toHaveBeenCalledTimes( 1 );

			// Tab to focus the tablist. Make sure Alpha is focused.
			expect( await getSelectedTab() ).toHaveTextContent( 'Alpha' );
			expect( await getSelectedTab() ).not.toHaveFocus();
			await user.keyboard( '[Tab]' );
			expect( await getSelectedTab() ).toHaveFocus();
			expect( mockOnSelect ).toHaveBeenCalledTimes( 1 );

			// Press the right arrow key three times. Since the delta tab is disabled:
			// - it won't be selected. The gamma tab will be selected instead, since
			//   it was the tab that was last selected before delta. Therefore, the
			//   `mockOnSelect` function gets called only twice (and not three times)
			// - it will receive focus, when using arrow keys
			await user.keyboard( '[ArrowRight][ArrowRight][ArrowRight]' );
			expect( await getSelectedTab() ).toHaveTextContent( 'Gamma' );
			expect(
				screen.getByRole( 'tab', { name: 'Delta' } )
			).toHaveFocus();
			expect( mockOnSelect ).toHaveBeenCalledTimes( 3 );
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'gamma' );

			// Navigate backwards with arrow keys. The gamma tab receives focus.
			// The `mockOnSelect` callback doesn't fire, since the gamma tab was
			// already selected.
			await user.keyboard( '[ArrowLeft]' );
			expect( await getSelectedTab() ).toHaveTextContent( 'Gamma' );
			expect( await getSelectedTab() ).toHaveFocus();
			expect( mockOnSelect ).toHaveBeenCalledTimes( 3 );

			// Click on the disabled tab. Compared to using arrow keys to move the
			// focus, disabled tabs ignore pointer clicks — and therefore, they don't
			// receive focus, nor they cause the `mockOnSelect` function to fire.
			await user.click( screen.getByRole( 'tab', { name: 'Delta' } ) );
			expect( await getSelectedTab() ).toHaveTextContent( 'Gamma' );
			expect( await getSelectedTab() ).toHaveFocus();
			expect( mockOnSelect ).toHaveBeenCalledTimes( 3 );
		} );

		it( 'should not focus the next tab when the Tab key is pressed', async () => {
			const user = userEvent.setup();

			render( <UncontrolledTabs /> );

			// Tab should initially focus the first tab in the tablist, which
			// is Alpha.
			await user.keyboard( '[Tab]' );
			expect(
				await screen.findByRole( 'tab', { name: 'Alpha' } )
			).toHaveFocus();

			// Because all other tabs should have `tabindex=-1`, pressing Tab
			// should NOT move the focus to the next tab, which is Beta.
			await user.keyboard( '[Tab]' );
			expect(
				await screen.findByRole( 'tab', { name: 'Beta' } )
			).not.toHaveFocus();
		} );

		it( 'switches to manual tab activation when the `selectOnMove` prop is set to `false`', async () => {
			const user = userEvent.setup();
			const mockOnSelect = jest.fn();

			render(
				<UncontrolledTabs
					onSelect={ mockOnSelect }
					selectOnMove={ false }
				/>
			);

			// onSelect gets called on the initial render with the default
			// selected tab.
			expect( mockOnSelect ).toHaveBeenCalledTimes( 1 );

			// Click on Alpha and make sure it is selected.
			// onSelect shouldn't fire since the selected tab didn't change.
			await user.click( screen.getByRole( 'tab', { name: 'Alpha' } ) );
			expect( mockOnSelect ).toHaveBeenCalledTimes( 1 );
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'alpha' );

			// Navigate forward with arrow keys. Make sure Beta is focused, but
			// that the tab selection happens only when pressing the spacebar
			// or enter key.
			await user.keyboard( '[ArrowRight]' );
			expect( mockOnSelect ).toHaveBeenCalledTimes( 1 );
			expect(
				await screen.findByRole( 'tab', { name: 'Beta' } )
			).toHaveFocus();

			await user.keyboard( '[Enter]' );
			expect( mockOnSelect ).toHaveBeenCalledTimes( 2 );
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'beta' );

			// Navigate forward with arrow keys. Make sure Gamma (last tab) is
			// focused, but that tab selection happens only when pressing the
			// spacebar or enter key.
			await user.keyboard( '[ArrowRight]' );
			expect( mockOnSelect ).toHaveBeenCalledTimes( 2 );
			expect(
				screen.getByRole( 'tab', { name: 'Gamma' } )
			).toHaveFocus();

			await user.keyboard( '[Space]' );
			expect( mockOnSelect ).toHaveBeenCalledTimes( 3 );
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'gamma' );
		} );
	} );
	describe( 'Uncontrolled mode', () => {
		describe( 'Without `initialTabId` prop', () => {
			it( 'should render first tab', async () => {
				render( <UncontrolledTabs /> );

				expect( await getSelectedTab() ).toHaveTextContent( 'Alpha' );
				expect(
					await screen.findByRole( 'tabpanel', { name: 'Alpha' } )
				).toBeInTheDocument();
			} );
			it( 'should fall back to first enabled tab if the active tab is removed', async () => {
				const { rerender } = render(
					<Tabs>
						<Tabs.TabList>
							{ TABS.map( ( tab ) => (
								<Tabs.Tab
									key={ tab.id }
									id={ tab.id }
									title={ tab.title }
									className={ tab.tab.className }
								>
									{ tab.title }
								</Tabs.Tab>
							) ) }
						</Tabs.TabList>
						{ TABS.map( ( tab ) => (
							<Tabs.TabPanel key={ tab.id } id={ tab.id }>
								{ tab.content }
							</Tabs.TabPanel>
						) ) }
					</Tabs>
				);

				rerender(
					<Tabs>
						<Tabs.TabList>
							{ /* Remove alpha */ }
							{ TABS.slice( 1 ).map( ( tab ) => (
								<Tabs.Tab
									key={ tab.id }
									id={ tab.id }
									title={ tab.title }
									className={ tab.tab.className }
								>
									{ tab.title }
								</Tabs.Tab>
							) ) }
						</Tabs.TabList>
						{ TABS.slice( 1 ).map( ( tab ) => (
							<Tabs.TabPanel key={ tab.id } id={ tab.id }>
								{ tab.content }
							</Tabs.TabPanel>
						) ) }
					</Tabs>
				);
				expect( await getSelectedTab() ).toHaveTextContent( 'Beta' );
			} );
		} );
		describe( 'With `initialTabId`', () => {
			it( 'should render the tab set by `initialTabId` prop', async () => {
				render( <UncontrolledTabs initialTabId="beta" /> );

				expect( await getSelectedTab() ).toHaveTextContent( 'Beta' );
			} );

			it( 'should not select a tab when `initialTabId` does not match any known tab', () => {
				render( <UncontrolledTabs initialTabId="does-not-exist" /> );

				// No tab should be selected i.e. it doesn't fall back to first tab.
				expect(
					screen.queryByRole( 'tab', { selected: true } )
				).not.toBeInTheDocument();

				// No tabpanel should be rendered either
				expect(
					screen.queryByRole( 'tabpanel' )
				).not.toBeInTheDocument();
			} );
			it( 'should not change tabs when initialTabId is changed', async () => {
				const { rerender } = render(
					<UncontrolledTabs initialTabId="beta" />
				);

				rerender( <UncontrolledTabs initialTabId="alpha" /> );

				expect( await getSelectedTab() ).toHaveTextContent( 'Beta' );
			} );

			it( 'should fall back to the tab associated to `initialTabId` if the currently active tab is removed', async () => {
				const user = userEvent.setup();
				const mockOnSelect = jest.fn();

				const { rerender } = render(
					<Tabs initialTabId="gamma" onSelect={ mockOnSelect }>
						<Tabs.TabList>
							{ TABS.map( ( tab ) => (
								<Tabs.Tab
									key={ tab.id }
									id={ tab.id }
									title={ tab.title }
									className={ tab.tab.className }
								>
									{ tab.title }
								</Tabs.Tab>
							) ) }
						</Tabs.TabList>
						{ TABS.map( ( tab ) => (
							<Tabs.TabPanel key={ tab.id } id={ tab.id }>
								{ tab.content }
							</Tabs.TabPanel>
						) ) }
					</Tabs>
				);

				expect( await getSelectedTab() ).toHaveTextContent( 'Gamma' );

				await user.click(
					screen.getByRole( 'tab', { name: 'Alpha' } )
				);
				expect( await getSelectedTab() ).toHaveTextContent( 'Alpha' );
				expect( mockOnSelect ).toHaveBeenLastCalledWith( 'alpha' );

				rerender(
					<Tabs initialTabId="gamma" onSelect={ mockOnSelect }>
						<Tabs.TabList>
							{ /* Remove alpha */ }
							{ TABS.slice( 1 ).map( ( tab ) => (
								<Tabs.Tab
									key={ tab.id }
									id={ tab.id }
									title={ tab.title }
									className={ tab.tab.className }
								>
									{ tab.title }
								</Tabs.Tab>
							) ) }
						</Tabs.TabList>
						{ TABS.slice( 1 ).map( ( tab ) => (
							<Tabs.TabPanel key={ tab.id } id={ tab.id }>
								{ tab.content }
							</Tabs.TabPanel>
						) ) }
					</Tabs>
				);

				expect( await getSelectedTab() ).toHaveTextContent( 'Gamma' );
			} );

			it( 'should have no active tabs when the tab associated to `initialTabId` is removed while being the active tab', async () => {
				const { rerender } = render(
					<Tabs initialTabId="gamma">
						<Tabs.TabList>
							{ TABS.map( ( tab ) => (
								<Tabs.Tab
									key={ tab.id }
									id={ tab.id }
									title={ tab.title }
									className={ tab.tab.className }
								>
									{ tab.title }
								</Tabs.Tab>
							) ) }
						</Tabs.TabList>
						{ TABS.map( ( tab ) => (
							<Tabs.TabPanel key={ tab.id } id={ tab.id }>
								{ tab.content }
							</Tabs.TabPanel>
						) ) }
					</Tabs>
				);

				expect( await getSelectedTab() ).toHaveTextContent( 'Gamma' );

				rerender(
					<Tabs initialTabId="gamma">
						<Tabs.TabList>
							{ /* Remove gamma */ }
							{ TABS.slice( 0, 2 ).map( ( tab ) => (
								<Tabs.Tab
									key={ tab.id }
									id={ tab.id }
									title={ tab.title }
									className={ tab.tab.className }
								>
									{ tab.title }
								</Tabs.Tab>
							) ) }
						</Tabs.TabList>
						{ TABS.slice( 0, 2 ).map( ( tab ) => (
							<Tabs.TabPanel key={ tab.id } id={ tab.id }>
								{ tab.content }
							</Tabs.TabPanel>
						) ) }
					</Tabs>
				);

				expect( screen.getAllByRole( 'tab' ) ).toHaveLength( 2 );
				// No tab should be selected i.e. it doesn't fall back to first tab.
				expect(
					screen.queryByRole( 'tab', { selected: true } )
				).not.toBeInTheDocument();
				// No tabpanel should be rendered either
				expect(
					screen.queryByRole( 'tabpanel' )
				).not.toBeInTheDocument();
			} );

			it( 'waits for the tab with the `initialTabId` to be present in the `tabs` array before selecting it', async () => {
				const { rerender } = render(
					<Tabs initialTabId="delta">
						<Tabs.TabList>
							{ TABS.map( ( tab ) => (
								<Tabs.Tab
									key={ tab.id }
									id={ tab.id }
									title={ tab.title }
									className={ tab.tab.className }
								>
									{ tab.title }
								</Tabs.Tab>
							) ) }
						</Tabs.TabList>
						{ TABS.map( ( tab ) => (
							<Tabs.TabPanel key={ tab.id } id={ tab.id }>
								{ tab.content }
							</Tabs.TabPanel>
						) ) }
					</Tabs>
				);

				// There should be no selected tab yet.
				expect(
					screen.queryByRole( 'tab', { selected: true } )
				).not.toBeInTheDocument();

				rerender(
					<Tabs initialTabId="delta">
						<Tabs.TabList>
							{ TABS_WITH_DELTA.map( ( tab ) => (
								<Tabs.Tab
									key={ tab.id }
									id={ tab.id }
									title={ tab.title }
									className={ tab.tab.className }
								>
									{ tab.title }
								</Tabs.Tab>
							) ) }
						</Tabs.TabList>
						{ TABS_WITH_DELTA.map( ( tab ) => (
							<Tabs.TabPanel key={ tab.id } id={ tab.id }>
								{ tab.content }
							</Tabs.TabPanel>
						) ) }
					</Tabs>
				);

				expect( await getSelectedTab() ).toHaveTextContent( 'Delta' );
			} );
		} );
		describe( 'Disabled tab', () => {
			it( 'should disable the tab when `disabled` is `true`', async () => {
				const user = userEvent.setup();
				const mockOnSelect = jest.fn();

				render(
					<Tabs onSelect={ mockOnSelect }>
						<Tabs.TabList>
							{ TABS_WITH_DELTA.map( ( tab ) => (
								<Tabs.Tab
									key={ tab.id }
									id={ tab.id }
									title={ tab.title }
									className={ tab.tab.className }
									// Disable delta
									disabled={ tab.id === 'delta' }
								>
									{ tab.title }
								</Tabs.Tab>
							) ) }
						</Tabs.TabList>
						{ TABS_WITH_DELTA.map( ( tab ) => (
							<Tabs.TabPanel key={ tab.id } id={ tab.id }>
								{ tab.content }
							</Tabs.TabPanel>
						) ) }
					</Tabs>
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

			it( 'should select first enabled tab when the initial tab is disabled', async () => {
				const { rerender } = render(
					<Tabs>
						<Tabs.TabList>
							{ TABS.map( ( tab ) => (
								<Tabs.Tab
									key={ tab.id }
									id={ tab.id }
									title={ tab.title }
									className={ tab.tab.className }
									// Disable alpha
									disabled={ tab.id === 'alpha' }
								>
									{ tab.title }
								</Tabs.Tab>
							) ) }
						</Tabs.TabList>
						{ TABS.map( ( tab ) => (
							<Tabs.TabPanel key={ tab.id } id={ tab.id }>
								{ tab.content }
							</Tabs.TabPanel>
						) ) }
					</Tabs>
				);

				// As alpha (first tab) is disabled,
				// the first enabled tab should be beta.
				expect( await getSelectedTab() ).toHaveTextContent( 'Beta' );

				// Re-enable all tabs
				rerender(
					<Tabs>
						<Tabs.TabList>
							{ TABS.map( ( tab ) => (
								<Tabs.Tab
									key={ tab.id }
									id={ tab.id }
									title={ tab.title }
									className={ tab.tab.className }
								>
									{ tab.title }
								</Tabs.Tab>
							) ) }
						</Tabs.TabList>
						{ TABS.map( ( tab ) => (
							<Tabs.TabPanel key={ tab.id } id={ tab.id }>
								{ tab.content }
							</Tabs.TabPanel>
						) ) }
					</Tabs>
				);

				// Even if the initial tab becomes enabled again, the selected
				// tab doesn't change.
				expect( await getSelectedTab() ).toHaveTextContent( 'Beta' );
			} );

			it( 'should select first enabled tab when the tab associated to `initialTabId` is disabled', async () => {
				const { rerender } = render(
					<Tabs initialTabId="beta">
						<Tabs.TabList>
							{ TABS.map( ( tab ) => (
								<Tabs.Tab
									key={ tab.id }
									id={ tab.id }
									title={ tab.title }
									className={ tab.tab.className }
									disabled={ tab.id !== 'gamma' }
								>
									{ tab.title }
								</Tabs.Tab>
							) ) }
						</Tabs.TabList>
						{ TABS.map( ( tab ) => (
							<Tabs.TabPanel key={ tab.id } id={ tab.id }>
								{ tab.content }
							</Tabs.TabPanel>
						) ) }
					</Tabs>
				);

				// As alpha (first tab), and beta (the initial tab), are both
				// disabled the first enabled tab should be gamma.
				expect( await getSelectedTab() ).toHaveTextContent( 'Gamma' );

				// Re-enable all tabs
				rerender(
					<Tabs initialTabId="beta">
						<Tabs.TabList>
							{ TABS.map( ( tab ) => (
								<Tabs.Tab
									key={ tab.id }
									id={ tab.id }
									title={ tab.title }
									className={ tab.tab.className }
								>
									{ tab.title }
								</Tabs.Tab>
							) ) }
						</Tabs.TabList>
						{ TABS.map( ( tab ) => (
							<Tabs.TabPanel key={ tab.id } id={ tab.id }>
								{ tab.content }
							</Tabs.TabPanel>
						) ) }
					</Tabs>
				);

				// Even if the initial tab becomes enabled again, the selected tab doesn't
				// change.
				expect( await getSelectedTab() ).toHaveTextContent( 'Gamma' );
			} );

			it( 'should select the first enabled tab when the selected tab becomes disabled', async () => {
				const mockOnSelect = jest.fn();
				const { rerender } = render(
					<Tabs onSelect={ mockOnSelect }>
						<Tabs.TabList>
							{ TABS.map( ( tab ) => (
								<Tabs.Tab
									key={ tab.id }
									id={ tab.id }
									title={ tab.title }
									className={ tab.tab.className }
								>
									{ tab.title }
								</Tabs.Tab>
							) ) }
						</Tabs.TabList>
						{ TABS.map( ( tab ) => (
							<Tabs.TabPanel key={ tab.id } id={ tab.id }>
								{ tab.content }
							</Tabs.TabPanel>
						) ) }
					</Tabs>
				);

				expect( await getSelectedTab() ).toHaveTextContent( 'Alpha' );
				expect( mockOnSelect ).toHaveBeenCalledTimes( 1 );
				expect( mockOnSelect ).toHaveBeenLastCalledWith( 'alpha' );

				rerender(
					<Tabs onSelect={ mockOnSelect }>
						<Tabs.TabList>
							{ TABS.map( ( tab ) => (
								<Tabs.Tab
									key={ tab.id }
									id={ tab.id }
									title={ tab.title }
									className={ tab.tab.className }
									// Disable alpha
									disabled={ tab.id === 'alpha' }
								>
									{ tab.title }
								</Tabs.Tab>
							) ) }
						</Tabs.TabList>
						{ TABS.map( ( tab ) => (
							<Tabs.TabPanel key={ tab.id } id={ tab.id }>
								{ tab.content }
							</Tabs.TabPanel>
						) ) }
					</Tabs>
				);

				expect( await getSelectedTab() ).toHaveTextContent( 'Beta' );
				expect( mockOnSelect ).toHaveBeenCalledTimes( 2 );
				expect( mockOnSelect ).toHaveBeenLastCalledWith( 'beta' );

				// Re-enable all tabs
				rerender(
					<Tabs onSelect={ mockOnSelect }>
						<Tabs.TabList>
							{ TABS.map( ( tab ) => (
								<Tabs.Tab
									key={ tab.id }
									id={ tab.id }
									title={ tab.title }
									className={ tab.tab.className }
								>
									{ tab.title }
								</Tabs.Tab>
							) ) }
						</Tabs.TabList>
						{ TABS.map( ( tab ) => (
							<Tabs.TabPanel key={ tab.id } id={ tab.id }>
								{ tab.content }
							</Tabs.TabPanel>
						) ) }
					</Tabs>
				);

				expect( await getSelectedTab() ).toHaveTextContent( 'Beta' );
				expect( mockOnSelect ).toHaveBeenCalledTimes( 2 );
				expect( mockOnSelect ).toHaveBeenLastCalledWith( 'beta' );
			} );

			it( 'should select the first enabled tab when the tab associated to `initialTabId` becomes disabled while being the active tab', async () => {
				const mockOnSelect = jest.fn();

				const { rerender } = render(
					<Tabs initialTabId="gamma" onSelect={ mockOnSelect }>
						<Tabs.TabList>
							{ TABS.map( ( tab ) => (
								<Tabs.Tab
									key={ tab.id }
									id={ tab.id }
									title={ tab.title }
									className={ tab.tab.className }
								>
									{ tab.title }
								</Tabs.Tab>
							) ) }
						</Tabs.TabList>
						{ TABS.map( ( tab ) => (
							<Tabs.TabPanel key={ tab.id } id={ tab.id }>
								{ tab.content }
							</Tabs.TabPanel>
						) ) }
					</Tabs>
				);

				expect( await getSelectedTab() ).toHaveTextContent( 'Gamma' );

				rerender(
					<Tabs initialTabId="gamma" onSelect={ mockOnSelect }>
						<Tabs.TabList>
							{ TABS.map( ( tab ) => (
								<Tabs.Tab
									key={ tab.id }
									id={ tab.id }
									title={ tab.title }
									className={ tab.tab.className }
									// Disable gamma
									disabled={ tab.id === 'gamma' }
								>
									{ tab.title }
								</Tabs.Tab>
							) ) }
						</Tabs.TabList>
						{ TABS.map( ( tab ) => (
							<Tabs.TabPanel key={ tab.id } id={ tab.id }>
								{ tab.content }
							</Tabs.TabPanel>
						) ) }
					</Tabs>
				);

				expect( await getSelectedTab() ).toHaveTextContent( 'Alpha' );
				expect( mockOnSelect ).toHaveBeenCalledTimes( 1 );
				expect( mockOnSelect ).toHaveBeenLastCalledWith( 'alpha' );

				// Re-enable all tabs
				rerender(
					<Tabs initialTabId="gamma" onSelect={ mockOnSelect }>
						<Tabs.TabList>
							{ TABS.map( ( tab ) => (
								<Tabs.Tab
									key={ tab.id }
									id={ tab.id }
									title={ tab.title }
									className={ tab.tab.className }
								>
									{ tab.title }
								</Tabs.Tab>
							) ) }
						</Tabs.TabList>
						{ TABS.map( ( tab ) => (
							<Tabs.TabPanel key={ tab.id } id={ tab.id }>
								{ tab.content }
							</Tabs.TabPanel>
						) ) }
					</Tabs>
				);

				expect( await getSelectedTab() ).toHaveTextContent( 'Alpha' );
				expect( mockOnSelect ).toHaveBeenCalledTimes( 1 );
			} );
		} );
	} );

	describe( 'Controlled mode', () => {
		it( 'should not render any tab if `selectedTabId` does not match any known tab', () => {
			render(
				<ControlledTabs selectedTabId="does-not-exist">
					<Tabs.TabList>
						{ TABS_WITH_DELTA.map( ( tab ) => (
							<Tabs.Tab
								key={ tab.id }
								id={ tab.id }
								title={ tab.title }
								className={ tab.tab.className }
							>
								{ tab.title }
							</Tabs.Tab>
						) ) }
					</Tabs.TabList>
					{ TABS_WITH_DELTA.map( ( tab ) => (
						<Tabs.TabPanel key={ tab.id } id={ tab.id }>
							{ tab.content }
						</Tabs.TabPanel>
					) ) }
				</ControlledTabs>
			);

			// No tab should be selected i.e. it doesn't fall back to first tab.
			expect(
				screen.queryByRole( 'tab', { selected: true } )
			).not.toBeInTheDocument();
			// No tabpanel should be rendered either
			expect( screen.queryByRole( 'tabpanel' ) ).not.toBeInTheDocument();
		} );
		it( 'should not render any tab if `selectedTabId` refers to an disabled tab', async () => {
			render(
				<ControlledTabs selectedTabId="beta">
					<Tabs.TabList>
						{ TABS_WITH_DELTA.map( ( tab ) => (
							<Tabs.Tab
								key={ tab.id }
								id={ tab.id }
								title={ tab.title }
								className={ tab.tab.className }
								disabled={ tab.id === 'beta' }
							>
								{ tab.title }
							</Tabs.Tab>
						) ) }
					</Tabs.TabList>
					{ TABS_WITH_DELTA.map( ( tab ) => (
						<Tabs.TabPanel key={ tab.id } id={ tab.id }>
							{ tab.content }
						</Tabs.TabPanel>
					) ) }
				</ControlledTabs>
			);

			// No tab should be selected i.e. it doesn't fall back to first tab.
			await waitFor( () => {
				expect(
					screen.queryByRole( 'tab', { selected: true } )
				).not.toBeInTheDocument();
			} );
			// No tabpanel should be rendered either
			expect( screen.queryByRole( 'tabpanel' ) ).not.toBeInTheDocument();
		} );
		describe( 'Without `initialTabId` prop', () => {
			it( 'should render the tab specified by the `specifiedTabId` prop', async () => {
				render(
					<ControlledTabs selectedTabId="beta">
						<Tabs.TabList>
							{ TABS.map( ( tab ) => (
								<Tabs.Tab
									key={ tab.id }
									id={ tab.id }
									title={ tab.title }
									className={ tab.tab.className }
								>
									{ tab.title }
								</Tabs.Tab>
							) ) }
						</Tabs.TabList>
						{ TABS.map( ( tab ) => (
							<Tabs.TabPanel key={ tab.id } id={ tab.id }>
								{ tab.content }
							</Tabs.TabPanel>
						) ) }
					</ControlledTabs>
				);

				expect( await getSelectedTab() ).toHaveTextContent( 'Beta' );
				expect(
					await screen.findByRole( 'tabpanel', { name: 'Beta' } )
				).toBeInTheDocument();
			} );
			it( 'should not render any tab if the active tab is removed', async () => {
				const { rerender } = render(
					<ControlledTabs selectedTabId="beta">
						<Tabs.TabList>
							{ TABS.map( ( tab ) => (
								<Tabs.Tab
									key={ tab.id }
									id={ tab.id }
									title={ tab.title }
									className={ tab.tab.className }
								>
									{ tab.title }
								</Tabs.Tab>
							) ) }
						</Tabs.TabList>
						{ TABS.map( ( tab ) => (
							<Tabs.TabPanel key={ tab.id } id={ tab.id }>
								{ tab.content }
							</Tabs.TabPanel>
						) ) }
					</ControlledTabs>
				);

				rerender(
					<ControlledTabs>
						<Tabs.TabList>
							{ /* Remove beta */ }
							{ TABS.filter( ( tab ) => tab.id !== 'beta' ).map(
								( tab ) => (
									<Tabs.Tab
										key={ tab.id }
										id={ tab.id }
										title={ tab.title }
										className={ tab.tab.className }
									>
										{ tab.title }
									</Tabs.Tab>
								)
							) }
						</Tabs.TabList>
						{ TABS.filter( ( tab ) => tab.id !== 'beta' ).map(
							( tab ) => (
								<Tabs.TabPanel key={ tab.id } id={ tab.id }>
									{ tab.content }
								</Tabs.TabPanel>
							)
						) }
					</ControlledTabs>
				);

				expect( screen.getAllByRole( 'tab' ) ).toHaveLength( 2 );

				// No tab should be selected i.e. it doesn't fall back to first tab.
				expect(
					screen.queryByRole( 'tab', { selected: true } )
				).not.toBeInTheDocument();
				// No tabpanel should be rendered either
				expect(
					screen.queryByRole( 'tabpanel' )
				).not.toBeInTheDocument();
			} );
		} );
		describe( 'With `initialTabId`', () => {
			it( 'should render the specified `selectedTabId`, and ignore the `initialTabId` prop', async () => {
				render(
					<ControlledTabs selectedTabId="gamma" initialTabId="beta">
						<Tabs.TabList>
							{ TABS.map( ( tab ) => (
								<Tabs.Tab
									key={ tab.id }
									id={ tab.id }
									title={ tab.title }
									className={ tab.tab.className }
								>
									{ tab.title }
								</Tabs.Tab>
							) ) }
						</Tabs.TabList>
						{ TABS.map( ( tab ) => (
							<Tabs.TabPanel key={ tab.id } id={ tab.id }>
								{ tab.content }
							</Tabs.TabPanel>
						) ) }
					</ControlledTabs>
				);

				expect( await getSelectedTab() ).toHaveTextContent( 'Gamma' );
			} );
			it( 'should render the specified `selectedTabId` when `initialTabId` does not match any known tab', async () => {
				render(
					<ControlledTabs
						selectedTabId="beta"
						initialTabId="does-not-exist"
					>
						<Tabs.TabList>
							{ TABS.map( ( tab ) => (
								<Tabs.Tab
									key={ tab.id }
									id={ tab.id }
									title={ tab.title }
									className={ tab.tab.className }
								>
									{ tab.title }
								</Tabs.Tab>
							) ) }
						</Tabs.TabList>
						{ TABS.map( ( tab ) => (
							<Tabs.TabPanel key={ tab.id } id={ tab.id }>
								{ tab.content }
							</Tabs.TabPanel>
						) ) }
					</ControlledTabs>
				);

				// No tab should be selected i.e. it doesn't fall back to first tab.
				expect( await getSelectedTab() ).toHaveTextContent( 'Beta' );
			} );
			it( 'should not change tabs when initialTabId is changed', async () => {
				const { rerender } = render(
					<ControlledTabs selectedTabId="gamma" initialTabId="beta">
						<Tabs.TabList>
							{ TABS.map( ( tab ) => (
								<Tabs.Tab
									key={ tab.id }
									id={ tab.id }
									title={ tab.title }
									className={ tab.tab.className }
								>
									{ tab.title }
								</Tabs.Tab>
							) ) }
						</Tabs.TabList>
						{ TABS.map( ( tab ) => (
							<Tabs.TabPanel key={ tab.id } id={ tab.id }>
								{ tab.content }
							</Tabs.TabPanel>
						) ) }
					</ControlledTabs>
				);

				rerender(
					<ControlledTabs selectedTabId="gamma" initialTabId="alpha">
						<Tabs.TabList>
							{ TABS.map( ( tab ) => (
								<Tabs.Tab
									key={ tab.id }
									id={ tab.id }
									title={ tab.title }
									className={ tab.tab.className }
								>
									{ tab.title }
								</Tabs.Tab>
							) ) }
						</Tabs.TabList>
						{ TABS.map( ( tab ) => (
							<Tabs.TabPanel key={ tab.id } id={ tab.id }>
								{ tab.content }
							</Tabs.TabPanel>
						) ) }
					</ControlledTabs>
				);

				expect( await getSelectedTab() ).toHaveTextContent( 'Gamma' );
			} );
			it( 'should not render any tab if the currently active tab is removed', async () => {
				const { rerender } = render(
					<ControlledTabs selectedTabId="beta" initialTabId="gamma">
						<Tabs.TabList>
							{ TABS.map( ( tab ) => (
								<Tabs.Tab
									key={ tab.id }
									id={ tab.id }
									title={ tab.title }
									className={ tab.tab.className }
								>
									{ tab.title }
								</Tabs.Tab>
							) ) }
						</Tabs.TabList>
						{ TABS.map( ( tab ) => (
							<Tabs.TabPanel key={ tab.id } id={ tab.id }>
								{ tab.content }
							</Tabs.TabPanel>
						) ) }
					</ControlledTabs>
				);

				expect( await getSelectedTab() ).toHaveTextContent( 'Beta' );

				rerender(
					<ControlledTabs selectedTabId="beta" initialTabId="gamma">
						<Tabs.TabList>
							{ /* Remove beta */ }
							{ TABS.filter( ( tab ) => tab.id !== 'beta' ).map(
								( tab ) => (
									<Tabs.Tab
										key={ tab.id }
										id={ tab.id }
										title={ tab.title }
										className={ tab.tab.className }
									>
										{ tab.title }
									</Tabs.Tab>
								)
							) }
						</Tabs.TabList>
						{ TABS.filter( ( tab ) => tab.id !== 'beta' ).map(
							( tab ) => (
								<Tabs.TabPanel key={ tab.id } id={ tab.id }>
									{ tab.content }
								</Tabs.TabPanel>
							)
						) }
					</ControlledTabs>
				);

				expect( screen.getAllByRole( 'tab' ) ).toHaveLength( 2 );
				// No tab should be selected i.e. it doesn't fall back to first tab.
				expect(
					screen.queryByRole( 'tab', { selected: true } )
				).not.toBeInTheDocument();
				// No tabpanel should be rendered either
				expect(
					screen.queryByRole( 'tabpanel' )
				).not.toBeInTheDocument();
			} );
			it( 'should have no active tabs when the tab associated to `initialTabId` is removed while being the active tab', async () => {
				const { rerender } = render(
					<ControlledTabs selectedTabId="gamma" initialTabId="gamma">
						<Tabs.TabList>
							{ TABS.map( ( tab ) => (
								<Tabs.Tab
									key={ tab.id }
									id={ tab.id }
									title={ tab.title }
									className={ tab.tab.className }
								>
									{ tab.title }
								</Tabs.Tab>
							) ) }
						</Tabs.TabList>
						{ TABS.map( ( tab ) => (
							<Tabs.TabPanel key={ tab.id } id={ tab.id }>
								{ tab.content }
							</Tabs.TabPanel>
						) ) }
					</ControlledTabs>
				);

				expect( await getSelectedTab() ).toHaveTextContent( 'Gamma' );

				rerender(
					<Tabs selectedTabId="gamma" initialTabId="gamma">
						<Tabs.TabList>
							{ /* Remove gamma */ }
							{ TABS.slice( 0, 2 ).map( ( tab ) => (
								<Tabs.Tab
									key={ tab.id }
									id={ tab.id }
									title={ tab.title }
									className={ tab.tab.className }
								>
									{ tab.title }
								</Tabs.Tab>
							) ) }
						</Tabs.TabList>
						{ TABS.map( ( tab ) => (
							<Tabs.TabPanel key={ tab.id } id={ tab.id }>
								{ tab.content }
							</Tabs.TabPanel>
						) ) }
					</Tabs>
				);

				expect( screen.getAllByRole( 'tab' ) ).toHaveLength( 2 );
				// No tab should be selected i.e. it doesn't fall back to first tab.
				expect(
					screen.queryByRole( 'tab', { selected: true } )
				).not.toBeInTheDocument();
				// No tabpanel should be rendered either
				expect(
					screen.queryByRole( 'tabpanel' )
				).not.toBeInTheDocument();
			} );
			it( 'does not select `initialTabId` if it becomes available after the initial render', async () => {
				const { rerender } = render(
					<ControlledTabs selectedTabId="beta" initialTabId="delta">
						<Tabs.TabList>
							{ TABS.map( ( tab ) => (
								<Tabs.Tab
									key={ tab.id }
									id={ tab.id }
									title={ tab.title }
									className={ tab.tab.className }
								>
									{ tab.title }
								</Tabs.Tab>
							) ) }
						</Tabs.TabList>
						{ TABS.map( ( tab ) => (
							<Tabs.TabPanel key={ tab.id } id={ tab.id }>
								{ tab.content }
							</Tabs.TabPanel>
						) ) }
					</ControlledTabs>
				);

				// The controlled tab, Beta, should be selected.
				expect( await getSelectedTab() ).toHaveTextContent( 'Beta' );

				rerender(
					<ControlledTabs selectedTabId="beta" initialTabId="delta">
						<Tabs.TabList>
							{ TABS_WITH_DELTA.map( ( tab ) => (
								<Tabs.Tab
									key={ tab.id }
									id={ tab.id }
									title={ tab.title }
									className={ tab.tab.className }
								>
									{ tab.title }
								</Tabs.Tab>
							) ) }
						</Tabs.TabList>
						{ TABS_WITH_DELTA.map( ( tab ) => (
							<Tabs.TabPanel key={ tab.id } id={ tab.id }>
								{ tab.content }
							</Tabs.TabPanel>
						) ) }
					</ControlledTabs>
				);

				// Beta should remain selected, even after the `initialTabId` of Delta becomes available.
				expect( await getSelectedTab() ).toHaveTextContent( 'Beta' );
			} );
		} );
		describe( 'Disabled tab', () => {
			it( 'should render the specified `selectedTabId` (not the first enabled tab) when the tab associated to `initialTabId` is disabled', async () => {
				const { rerender } = render(
					<ControlledTabs selectedTabId="gamma" initialTabId="beta">
						<Tabs.TabList>
							{ TABS.map( ( tab ) => (
								<Tabs.Tab
									key={ tab.id }
									id={ tab.id }
									title={ tab.title }
									className={ tab.tab.className }
									disabled={ tab.id === 'beta' }
								>
									{ tab.title }
								</Tabs.Tab>
							) ) }
						</Tabs.TabList>
						{ TABS.map( ( tab ) => (
							<Tabs.TabPanel key={ tab.id } id={ tab.id }>
								{ tab.content }
							</Tabs.TabPanel>
						) ) }
					</ControlledTabs>
				);

				expect( await getSelectedTab() ).toHaveTextContent( 'Gamma' );

				// Re-enable all tabs
				rerender(
					<ControlledTabs initialTabId="beta">
						<Tabs.TabList>
							{ TABS.map( ( tab ) => (
								<Tabs.Tab
									key={ tab.id }
									id={ tab.id }
									title={ tab.title }
									className={ tab.tab.className }
								>
									{ tab.title }
								</Tabs.Tab>
							) ) }
						</Tabs.TabList>
						{ TABS.map( ( tab ) => (
							<Tabs.TabPanel key={ tab.id } id={ tab.id }>
								{ tab.content }
							</Tabs.TabPanel>
						) ) }
					</ControlledTabs>
				);

				// Even if the initial tab becomes enabled again, the selected tab doesn't
				// change.
				expect( await getSelectedTab() ).toHaveTextContent( 'Gamma' );
			} );
			it( 'should not render any tab when the selected tab becomes disabled', async () => {
				const { rerender } = render(
					<ControlledTabs selectedTabId="beta">
						<Tabs.TabList>
							{ TABS.map( ( tab ) => (
								<Tabs.Tab
									key={ tab.id }
									id={ tab.id }
									title={ tab.title }
									className={ tab.tab.className }
								>
									{ tab.title }
								</Tabs.Tab>
							) ) }
						</Tabs.TabList>
						{ TABS.map( ( tab ) => (
							<Tabs.TabPanel key={ tab.id } id={ tab.id }>
								{ tab.content }
							</Tabs.TabPanel>
						) ) }
					</ControlledTabs>
				);

				expect( await getSelectedTab() ).toHaveTextContent( 'Beta' );

				rerender(
					<ControlledTabs selectedTabId="beta">
						<Tabs.TabList>
							{ TABS.map( ( tab ) => (
								<Tabs.Tab
									key={ tab.id }
									id={ tab.id }
									title={ tab.title }
									className={ tab.tab.className }
									// Disable beta
									disabled={ tab.id === 'beta' }
								>
									{ tab.title }
								</Tabs.Tab>
							) ) }
						</Tabs.TabList>
						{ TABS.map( ( tab ) => (
							<Tabs.TabPanel key={ tab.id } id={ tab.id }>
								{ tab.content }
							</Tabs.TabPanel>
						) ) }
					</ControlledTabs>
				);
				// No tab should be selected i.e. it doesn't fall back to first tab.
				// `waitFor` is needed here to prevent testing library from
				// throwing a 'not wrapped in `act()`' error.
				await waitFor( () => {
					expect(
						screen.queryByRole( 'tab', { selected: true } )
					).not.toBeInTheDocument();
				} );
				// No tabpanel should be rendered either
				expect(
					screen.queryByRole( 'tabpanel' )
				).not.toBeInTheDocument();

				// re-enable all tabs
				rerender(
					<ControlledTabs selectedTabId="beta">
						<Tabs.TabList>
							{ TABS.map( ( tab ) => (
								<Tabs.Tab
									key={ tab.id }
									id={ tab.id }
									title={ tab.title }
									className={ tab.tab.className }
								>
									{ tab.title }
								</Tabs.Tab>
							) ) }
						</Tabs.TabList>
						{ TABS.map( ( tab ) => (
							<Tabs.TabPanel key={ tab.id } id={ tab.id }>
								{ tab.content }
							</Tabs.TabPanel>
						) ) }
					</ControlledTabs>
				);

				// If the previously selected tab is reenabled, it should not
				// be reselected.
				expect(
					screen.queryByRole( 'tab', { selected: true } )
				).not.toBeInTheDocument();
				// No tabpanel should be rendered either
				expect(
					screen.queryByRole( 'tabpanel' )
				).not.toBeInTheDocument();
			} );
			it( 'should not render any tab when the tab associated to `initialTabId` becomes disabled while being the active tab', async () => {
				const { rerender } = render(
					<ControlledTabs initialTabId="gamma" selectedTabId="gamma">
						<Tabs.TabList>
							{ TABS.map( ( tab ) => (
								<Tabs.Tab
									key={ tab.id }
									id={ tab.id }
									title={ tab.title }
									className={ tab.tab.className }
								>
									{ tab.title }
								</Tabs.Tab>
							) ) }
						</Tabs.TabList>
						{ TABS.map( ( tab ) => (
							<Tabs.TabPanel key={ tab.id } id={ tab.id }>
								{ tab.content }
							</Tabs.TabPanel>
						) ) }
					</ControlledTabs>
				);

				expect( await getSelectedTab() ).toHaveTextContent( 'Gamma' );

				rerender(
					<ControlledTabs initialTabId="gamma" selectedTabId="gamma">
						<Tabs.TabList>
							{ TABS.map( ( tab ) => (
								<Tabs.Tab
									key={ tab.id }
									id={ tab.id }
									title={ tab.title }
									className={ tab.tab.className }
									// Disable gamma
									disabled={ tab.id === 'gamma' }
								>
									{ tab.title }
								</Tabs.Tab>
							) ) }
						</Tabs.TabList>
						{ TABS.map( ( tab ) => (
							<Tabs.TabPanel key={ tab.id } id={ tab.id }>
								{ tab.content }
							</Tabs.TabPanel>
						) ) }
					</ControlledTabs>
				);

				// No tab should be selected i.e. it doesn't fall back to first tab.
				// `waitFor` is needed here to prevent testing library from
				// throwing a 'not wrapped in `act()`' error.
				await waitFor( () => {
					expect(
						screen.queryByRole( 'tab', { selected: true } )
					).not.toBeInTheDocument();
				} );
				// No tabpanel should be rendered either
				expect(
					screen.queryByRole( 'tabpanel' )
				).not.toBeInTheDocument();

				// re-enable all tabs
				rerender(
					<ControlledTabs initialTabId="gamma" selectedTabId="gamma">
						<Tabs.TabList>
							{ TABS.map( ( tab ) => (
								<Tabs.Tab
									key={ tab.id }
									id={ tab.id }
									title={ tab.title }
									className={ tab.tab.className }
								>
									{ tab.title }
								</Tabs.Tab>
							) ) }
						</Tabs.TabList>
						{ TABS.map( ( tab ) => (
							<Tabs.TabPanel key={ tab.id } id={ tab.id }>
								{ tab.content }
							</Tabs.TabPanel>
						) ) }
					</ControlledTabs>
				);

				// If the previously selected tab is reenabled, it should not
				// be reselected.
				expect(
					screen.queryByRole( 'tab', { selected: true } )
				).not.toBeInTheDocument();
				// No tabpanel should be rendered either
				expect(
					screen.queryByRole( 'tabpanel' )
				).not.toBeInTheDocument();
			} );
		} );
	} );

	describe( 'Without `initialTabId` prop', () => {
		describe( 'in uncontrolled mode', () => {} );
		describe( 'in controlled mode', () => {} );
	} );
	describe( 'With `initialTabId`', () => {
		describe( 'in uncontrolled mode', () => {} );
		describe( 'in controlled mode', () => {} );
	} );
	describe( 'Controlled Mode', () => {} );
	describe( 'Disabled Tab', () => {
		describe( 'in uncontrolled mode', () => {} );
		describe( 'in controlled mode', () => {} );
	} );
} );
