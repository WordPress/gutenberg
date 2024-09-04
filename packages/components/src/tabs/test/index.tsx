/**
 * External dependencies
 */
import { screen, waitFor } from '@testing-library/react';
import { press, click } from '@ariakit/test';
import { render } from '@ariakit/test/react';

/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Tabs from '..';
import type { TabsProps } from '../types';

type Tab = {
	tabId: string;
	title: string;
	content: React.ReactNode;
	tab: {
		className?: string;
		disabled?: boolean;
	};
	tabpanel?: {
		focusable?: boolean;
	};
};

const TABS: Tab[] = [
	{
		tabId: 'alpha',
		title: 'Alpha',
		content: 'Selected tab: Alpha',
		tab: { className: 'alpha-class' },
	},
	{
		tabId: 'beta',
		title: 'Beta',
		content: 'Selected tab: Beta',
		tab: { className: 'beta-class' },
	},
	{
		tabId: 'gamma',
		title: 'Gamma',
		content: 'Selected tab: Gamma',
		tab: { className: 'gamma-class' },
	},
];

const TABS_WITH_DELTA: Tab[] = [
	...TABS,
	{
		tabId: 'delta',
		title: 'Delta',
		content: 'Selected tab: Delta',
		tab: { className: 'delta-class' },
	},
];

const UncontrolledTabs = ( {
	tabs,
	...props
}: Omit< TabsProps, 'children' > & {
	tabs: Tab[];
} ) => {
	return (
		<Tabs { ...props }>
			<Tabs.TabList>
				{ tabs.map( ( tabObj ) => (
					<Tabs.Tab
						key={ tabObj.tabId }
						tabId={ tabObj.tabId }
						className={ tabObj.tab.className }
						disabled={ tabObj.tab.disabled }
					>
						{ tabObj.title }
					</Tabs.Tab>
				) ) }
			</Tabs.TabList>
			{ tabs.map( ( tabObj ) => (
				<Tabs.TabPanel
					key={ tabObj.tabId }
					tabId={ tabObj.tabId }
					focusable={ tabObj.tabpanel?.focusable }
				>
					{ tabObj.content }
				</Tabs.TabPanel>
			) ) }
		</Tabs>
	);
};

const ControlledTabs = ( {
	tabs,
	...props
}: Omit< TabsProps, 'children' > & {
	tabs: Tab[];
} ) => {
	const [ selectedTabId, setSelectedTabId ] = useState<
		string | undefined | null
	>( props.selectedTabId );

	useEffect( () => {
		setSelectedTabId( props.selectedTabId );
	}, [ props.selectedTabId ] );

	return (
		<Tabs
			{ ...props }
			selectedTabId={ selectedTabId }
			onSelect={ ( selectedId ) => {
				setSelectedTabId( selectedId );
				props.onSelect?.( selectedId );
			} }
		>
			<Tabs.TabList>
				{ tabs.map( ( tabObj ) => (
					<Tabs.Tab
						key={ tabObj.tabId }
						tabId={ tabObj.tabId }
						className={ tabObj.tab.className }
						disabled={ tabObj.tab.disabled }
					>
						{ tabObj.title }
					</Tabs.Tab>
				) ) }
			</Tabs.TabList>
			{ tabs.map( ( tabObj ) => (
				<Tabs.TabPanel key={ tabObj.tabId } tabId={ tabObj.tabId }>
					{ tabObj.content }
				</Tabs.TabPanel>
			) ) }
		</Tabs>
	);
};

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
			await render( <UncontrolledTabs tabs={ TABS } /> );

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
	} );
	describe( 'Focus Behavior', () => {
		it( 'should focus on the related TabPanel when pressing the Tab key', async () => {
			await render( <UncontrolledTabs tabs={ TABS } /> );

			const selectedTabPanel = await screen.findByRole( 'tabpanel' );

			// Tab should initially focus the first tab in the tablist, which
			// is Alpha.
			await press.Tab();
			expect(
				await screen.findByRole( 'tab', { name: 'Alpha' } )
			).toHaveFocus();

			// By default the tabpanel should receive focus
			await press.Tab();
			expect( selectedTabPanel ).toHaveFocus();
		} );
		it( 'should not focus on the related TabPanel when pressing the Tab key if `focusable: false` is set', async () => {
			const TABS_WITH_ALPHA_FOCUSABLE_FALSE = TABS.map( ( tabObj ) =>
				tabObj.tabId === 'alpha'
					? {
							...tabObj,
							content: (
								<>
									Selected Tab: Alpha
									<button>Alpha Button</button>
								</>
							),
							tabpanel: { focusable: false },
					  }
					: tabObj
			);

			await render(
				<UncontrolledTabs tabs={ TABS_WITH_ALPHA_FOCUSABLE_FALSE } />
			);

			const alphaButton = await screen.findByRole( 'button', {
				name: /alpha button/i,
			} );

			// Tab should initially focus the first tab in the tablist, which
			// is Alpha.
			await press.Tab();
			expect(
				await screen.findByRole( 'tab', { name: 'Alpha' } )
			).toHaveFocus();
			// Because the alpha tabpanel is set to `focusable: false`, pressing
			// the Tab key should focus the button, not the tabpanel
			await press.Tab();
			expect( alphaButton ).toHaveFocus();
		} );

		it( 'should focus on the first enabled tab when pressing the Tab key if no tab is selected', async () => {
			const TABS_WITH_ALPHA_DISABLED = TABS.map( ( tabObj ) =>
				tabObj.tabId === 'alpha'
					? {
							...tabObj,
							tab: {
								...tabObj.tab,
								disabled: true,
							},
					  }
					: tabObj
			);

			await render(
				<ControlledTabs
					tabs={ TABS_WITH_ALPHA_DISABLED }
					selectedTabId={ null }
				/>
			);

			await press.Tab();
			expect(
				await screen.findByRole( 'tab', { name: 'Beta' } )
			).toHaveFocus();

			await press.ArrowRight();
			expect(
				await screen.findByRole( 'tab', { name: 'Gamma' } )
			).toHaveFocus();

			await press.Tab();
			await press.ShiftTab();
			expect(
				await screen.findByRole( 'tab', { name: 'Gamma' } )
			).toHaveFocus();
		} );
	} );

	describe( 'Tab Attributes', () => {
		it( "should apply the tab's `className` to the tab button", async () => {
			await render( <UncontrolledTabs tabs={ TABS } /> );

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
	} );

	describe( 'Tab Activation', () => {
		it( 'defaults to automatic tab activation (pointer clicks)', async () => {
			const mockOnSelect = jest.fn();

			await render(
				<UncontrolledTabs tabs={ TABS } onSelect={ mockOnSelect } />
			);

			// Alpha is the initially selected tab
			expect( await getSelectedTab() ).toHaveTextContent( 'Alpha' );
			expect(
				await screen.findByRole( 'tabpanel', { name: 'Alpha' } )
			).toBeInTheDocument();
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'alpha' );

			// Click on Beta, make sure beta is the selected tab
			await click( screen.getByRole( 'tab', { name: 'Beta' } ) );

			expect( await getSelectedTab() ).toHaveTextContent( 'Beta' );
			expect(
				screen.getByRole( 'tabpanel', { name: 'Beta' } )
			).toBeInTheDocument();
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'beta' );

			// Click on Alpha, make sure beta is the selected tab
			await click( screen.getByRole( 'tab', { name: 'Alpha' } ) );

			expect( await getSelectedTab() ).toHaveTextContent( 'Alpha' );
			expect(
				screen.getByRole( 'tabpanel', { name: 'Alpha' } )
			).toBeInTheDocument();
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'alpha' );
		} );

		it( 'defaults to automatic tab activation (arrow keys)', async () => {
			const mockOnSelect = jest.fn();

			await render(
				<UncontrolledTabs tabs={ TABS } onSelect={ mockOnSelect } />
			);

			// onSelect gets called on the initial render. It should be called
			// with the first enabled tab, which is alpha.
			expect( mockOnSelect ).toHaveBeenCalledTimes( 1 );
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'alpha' );

			// Tab to focus the tablist. Make sure alpha is focused.
			expect( await getSelectedTab() ).toHaveTextContent( 'Alpha' );
			expect( await getSelectedTab() ).not.toHaveFocus();
			await press.Tab();
			expect( await getSelectedTab() ).toHaveFocus();

			// Navigate forward with arrow keys and make sure the Beta tab is
			// selected automatically.
			await press.ArrowRight();
			expect( await getSelectedTab() ).toHaveTextContent( 'Beta' );
			expect( await getSelectedTab() ).toHaveFocus();
			expect( mockOnSelect ).toHaveBeenCalledTimes( 2 );
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'beta' );

			// Navigate backwards with arrow keys. Make sure alpha is
			// selected automatically.
			await press.ArrowLeft();
			expect( await getSelectedTab() ).toHaveTextContent( 'Alpha' );
			expect( await getSelectedTab() ).toHaveFocus();
			expect( mockOnSelect ).toHaveBeenCalledTimes( 3 );
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'alpha' );
		} );

		it( 'wraps around the last/first tab when using arrow keys', async () => {
			const mockOnSelect = jest.fn();

			await render(
				<UncontrolledTabs tabs={ TABS } onSelect={ mockOnSelect } />
			);

			// onSelect gets called on the initial render.
			expect( mockOnSelect ).toHaveBeenCalledTimes( 1 );

			// Tab to focus the tablist. Make sure Alpha is focused.
			expect( await getSelectedTab() ).toHaveTextContent( 'Alpha' );
			expect( await getSelectedTab() ).not.toHaveFocus();
			await press.Tab();
			expect( await getSelectedTab() ).toHaveFocus();

			// Navigate backwards with arrow keys and make sure that the Gamma tab
			// (the last tab) is selected automatically.
			await press.ArrowLeft();
			expect( await getSelectedTab() ).toHaveTextContent( 'Gamma' );
			expect( await getSelectedTab() ).toHaveFocus();
			expect( mockOnSelect ).toHaveBeenCalledTimes( 2 );
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'gamma' );

			// Navigate forward with arrow keys. Make sure alpha (the first tab) is
			// selected automatically.
			await press.ArrowRight();
			expect( await getSelectedTab() ).toHaveTextContent( 'Alpha' );
			expect( await getSelectedTab() ).toHaveFocus();
			expect( mockOnSelect ).toHaveBeenCalledTimes( 3 );
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'alpha' );
		} );

		it( 'should not move tab selection when pressing the up/down arrow keys, unless the orientation is changed to `vertical`', async () => {
			const mockOnSelect = jest.fn();

			const { rerender } = await render(
				<UncontrolledTabs tabs={ TABS } onSelect={ mockOnSelect } />
			);

			// onSelect gets called on the initial render. It should be called
			// with the first enabled tab, which is alpha.
			expect( mockOnSelect ).toHaveBeenCalledTimes( 1 );
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'alpha' );

			// Tab to focus the tablist. Make sure alpha is focused.
			expect( await getSelectedTab() ).toHaveTextContent( 'Alpha' );
			expect( await getSelectedTab() ).not.toHaveFocus();
			await press.Tab();
			expect( await getSelectedTab() ).toHaveFocus();

			// Press the arrow up key, nothing happens.
			await press.ArrowUp();
			expect( await getSelectedTab() ).toHaveTextContent( 'Alpha' );
			expect( await getSelectedTab() ).toHaveFocus();
			expect( mockOnSelect ).toHaveBeenCalledTimes( 1 );
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'alpha' );

			// Press the arrow down key, nothing happens
			await press.ArrowDown();
			expect( await getSelectedTab() ).toHaveTextContent( 'Alpha' );
			expect( await getSelectedTab() ).toHaveFocus();
			expect( mockOnSelect ).toHaveBeenCalledTimes( 1 );
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'alpha' );

			// Change orientation to `vertical`. When the orientation is vertical,
			// left/right arrow keys are replaced by up/down arrow keys.
			await rerender(
				<UncontrolledTabs
					tabs={ TABS }
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
			await press.ArrowDown();
			expect( await getSelectedTab() ).toHaveTextContent( 'Beta' );
			expect( await getSelectedTab() ).toHaveFocus();
			expect( mockOnSelect ).toHaveBeenCalledTimes( 2 );
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'beta' );

			// Navigate backwards with arrow keys. Make sure alpha is
			// selected automatically.
			await press.ArrowUp();
			expect( await getSelectedTab() ).toHaveTextContent( 'Alpha' );
			expect( await getSelectedTab() ).toHaveFocus();
			expect( mockOnSelect ).toHaveBeenCalledTimes( 3 );
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'alpha' );

			// Navigate backwards with arrow keys. Make sure alpha is
			// selected automatically.
			await press.ArrowUp();
			expect( await getSelectedTab() ).toHaveTextContent( 'Gamma' );
			expect( await getSelectedTab() ).toHaveFocus();
			expect( mockOnSelect ).toHaveBeenCalledTimes( 4 );
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'gamma' );

			// Navigate backwards with arrow keys. Make sure alpha is
			// selected automatically.
			await press.ArrowDown();
			expect( await getSelectedTab() ).toHaveTextContent( 'Alpha' );
			expect( await getSelectedTab() ).toHaveFocus();
			expect( mockOnSelect ).toHaveBeenCalledTimes( 5 );
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'alpha' );
		} );

		it( 'should move focus on a tab even if disabled with arrow key, but not with pointer clicks', async () => {
			const mockOnSelect = jest.fn();

			const TABS_WITH_DELTA_DISABLED = TABS_WITH_DELTA.map( ( tabObj ) =>
				tabObj.tabId === 'delta'
					? {
							...tabObj,
							tab: {
								...tabObj.tab,
								disabled: true,
							},
					  }
					: tabObj
			);

			await render(
				<UncontrolledTabs
					tabs={ TABS_WITH_DELTA_DISABLED }
					onSelect={ mockOnSelect }
				/>
			);

			// onSelect gets called on the initial render. It should be called
			// with the first enabled tab, which is alpha.
			expect( mockOnSelect ).toHaveBeenCalledTimes( 1 );
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'alpha' );

			// Tab to focus the tablist. Make sure Alpha is focused.
			expect( await getSelectedTab() ).toHaveTextContent( 'Alpha' );
			expect( await getSelectedTab() ).not.toHaveFocus();
			await press.Tab();
			expect( await getSelectedTab() ).toHaveFocus();
			// Confirm onSelect has not been re-called
			expect( mockOnSelect ).toHaveBeenCalledTimes( 1 );

			// Press the right arrow key three times. Since the delta tab is disabled:
			// - it won't be selected. The gamma tab will be selected instead, since
			//   it was the tab that was last selected before delta. Therefore, the
			//   `mockOnSelect` function gets called only twice (and not three times)
			// - it will receive focus, when using arrow keys
			await press.ArrowRight();
			await press.ArrowRight();
			await press.ArrowRight();
			expect( await getSelectedTab() ).toHaveTextContent( 'Gamma' );
			expect(
				screen.getByRole( 'tab', { name: 'Delta' } )
			).toHaveFocus();
			expect( mockOnSelect ).toHaveBeenCalledTimes( 3 );
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'gamma' );

			// Navigate backwards with arrow keys. The gamma tab receives focus.
			// The `mockOnSelect` callback doesn't fire, since the gamma tab was
			// already selected.
			await press.ArrowLeft();
			expect( await getSelectedTab() ).toHaveTextContent( 'Gamma' );
			expect( await getSelectedTab() ).toHaveFocus();
			expect( mockOnSelect ).toHaveBeenCalledTimes( 3 );

			// Click on the disabled tab. Compared to using arrow keys to move the
			// focus, disabled tabs ignore pointer clicks — and therefore, they don't
			// receive focus, nor they cause the `mockOnSelect` function to fire.
			await click( screen.getByRole( 'tab', { name: 'Delta' } ) );
			expect( await getSelectedTab() ).toHaveTextContent( 'Gamma' );
			expect( await getSelectedTab() ).toHaveFocus();
			expect( mockOnSelect ).toHaveBeenCalledTimes( 3 );
		} );

		it( 'should not focus the next tab when the Tab key is pressed', async () => {
			await render( <UncontrolledTabs tabs={ TABS } /> );

			// Tab should initially focus the first tab in the tablist, which
			// is Alpha.
			await press.Tab();
			expect(
				await screen.findByRole( 'tab', { name: 'Alpha' } )
			).toHaveFocus();

			// Because all other tabs should have `tabindex=-1`, pressing Tab
			// should NOT move the focus to the next tab, which is Beta.
			// Instead, focus should go to the currently selected tabpanel (alpha).
			await press.Tab();
			expect(
				await screen.findByRole( 'tabpanel', {
					name: 'Alpha',
				} )
			).toHaveFocus();
		} );

		it( 'switches to manual tab activation when the `selectOnMove` prop is set to `false`', async () => {
			const mockOnSelect = jest.fn();

			await render(
				<UncontrolledTabs
					tabs={ TABS }
					onSelect={ mockOnSelect }
					selectOnMove={ false }
				/>
			);

			// onSelect gets called on the initial render. It should be called
			// with the first enabled tab, which is alpha.
			expect( mockOnSelect ).toHaveBeenCalledTimes( 1 );
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'alpha' );

			// Click on Alpha and make sure it is selected.
			// onSelect shouldn't fire since the selected tab didn't change.
			await click( screen.getByRole( 'tab', { name: 'Alpha' } ) );
			expect(
				await screen.findByRole( 'tab', { name: 'Alpha' } )
			).toHaveFocus();
			expect( mockOnSelect ).toHaveBeenCalledTimes( 1 );
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'alpha' );

			// Navigate forward with arrow keys. Make sure Beta is focused, but
			// that the tab selection happens only when pressing the spacebar
			// or enter key. onSelect shouldn't fire since the selected tab
			// didn't change.
			await press.ArrowRight();
			expect(
				await screen.findByRole( 'tab', { name: 'Beta' } )
			).toHaveFocus();
			expect( mockOnSelect ).toHaveBeenCalledTimes( 1 );

			await press.Enter();
			expect( mockOnSelect ).toHaveBeenCalledTimes( 2 );
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'beta' );

			// Navigate forward with arrow keys. Make sure Gamma (last tab) is
			// focused, but that tab selection happens only when pressing the
			// spacebar or enter key. onSelect shouldn't fire since the selected
			// tab didn't change.
			await press.ArrowRight();
			expect(
				await screen.findByRole( 'tab', { name: 'Gamma' } )
			).toHaveFocus();
			expect( mockOnSelect ).toHaveBeenCalledTimes( 2 );
			expect(
				screen.getByRole( 'tab', { name: 'Gamma' } )
			).toHaveFocus();

			await press.Space();
			expect( mockOnSelect ).toHaveBeenCalledTimes( 3 );
			expect( mockOnSelect ).toHaveBeenLastCalledWith( 'gamma' );
		} );
	} );
	describe( 'Uncontrolled mode', () => {
		describe( 'Without `defaultTabId` prop', () => {
			it( 'should render first tab', async () => {
				await render( <UncontrolledTabs tabs={ TABS } /> );

				expect( await getSelectedTab() ).toHaveTextContent( 'Alpha' );
				expect(
					await screen.findByRole( 'tabpanel', { name: 'Alpha' } )
				).toBeInTheDocument();
			} );
			it( 'should fall back to first enabled tab if the active tab is removed', async () => {
				const { rerender } = await render(
					<UncontrolledTabs tabs={ TABS } />
				);

				// Remove first item from `TABS` array
				await rerender( <UncontrolledTabs tabs={ TABS.slice( 1 ) } /> );
				expect( await getSelectedTab() ).toHaveTextContent( 'Beta' );
			} );
			it( 'should not load any tab if the active tab is removed and there are no enabled tabs', async () => {
				const TABS_WITH_BETA_GAMMA_DISABLED = TABS.map( ( tabObj ) =>
					tabObj.tabId !== 'alpha'
						? {
								...tabObj,
								tab: {
									...tabObj.tab,
									disabled: true,
								},
						  }
						: tabObj
				);

				const { rerender } = await render(
					<UncontrolledTabs tabs={ TABS_WITH_BETA_GAMMA_DISABLED } />
				);
				expect( await getSelectedTab() ).toHaveTextContent( 'Alpha' );

				// Remove alpha
				await rerender(
					<UncontrolledTabs
						tabs={ TABS_WITH_BETA_GAMMA_DISABLED.slice( 1 ) }
					/>
				);

				// No tab should be selected i.e. it doesn't fall back to first tab.
				await waitFor( () =>
					expect(
						screen.queryByRole( 'tab', { selected: true } )
					).not.toBeInTheDocument()
				);

				// No tabpanel should be rendered either
				expect(
					screen.queryByRole( 'tabpanel' )
				).not.toBeInTheDocument();
			} );
		} );

		describe( 'With `defaultTabId`', () => {
			it( 'should render the tab set by `defaultTabId` prop', async () => {
				await render(
					<UncontrolledTabs tabs={ TABS } defaultTabId="beta" />
				);

				expect( await getSelectedTab() ).toHaveTextContent( 'Beta' );
			} );

			it( 'should not select a tab when `defaultTabId` does not match any known tab', async () => {
				await render(
					<UncontrolledTabs
						tabs={ TABS }
						defaultTabId="does-not-exist"
					/>
				);

				// No tab should be selected i.e. it doesn't fall back to first tab.
				expect(
					screen.queryByRole( 'tab', { selected: true } )
				).not.toBeInTheDocument();

				// No tabpanel should be rendered either
				expect(
					screen.queryByRole( 'tabpanel' )
				).not.toBeInTheDocument();
			} );
			it( 'should not change tabs when defaultTabId is changed', async () => {
				const { rerender } = await render(
					<UncontrolledTabs tabs={ TABS } defaultTabId="beta" />
				);

				await rerender(
					<UncontrolledTabs tabs={ TABS } defaultTabId="alpha" />
				);

				expect( await getSelectedTab() ).toHaveTextContent( 'Beta' );
			} );

			it( 'should fall back to the tab associated to `defaultTabId` if the currently active tab is removed', async () => {
				const mockOnSelect = jest.fn();

				const { rerender } = await render(
					<UncontrolledTabs
						tabs={ TABS }
						defaultTabId="gamma"
						onSelect={ mockOnSelect }
					/>
				);

				expect( await getSelectedTab() ).toHaveTextContent( 'Gamma' );

				await click( screen.getByRole( 'tab', { name: 'Alpha' } ) );
				expect( await getSelectedTab() ).toHaveTextContent( 'Alpha' );
				expect( mockOnSelect ).toHaveBeenLastCalledWith( 'alpha' );

				await rerender(
					<UncontrolledTabs
						tabs={ TABS.slice( 1 ) }
						defaultTabId="gamma"
						onSelect={ mockOnSelect }
					/>
				);

				expect( await getSelectedTab() ).toHaveTextContent( 'Gamma' );
			} );

			it( 'should fall back to the tab associated to `defaultTabId` if the currently active tab becomes disabled', async () => {
				const mockOnSelect = jest.fn();

				const { rerender } = await render(
					<UncontrolledTabs
						tabs={ TABS }
						defaultTabId="gamma"
						onSelect={ mockOnSelect }
					/>
				);

				expect( await getSelectedTab() ).toHaveTextContent( 'Gamma' );

				await click( screen.getByRole( 'tab', { name: 'Alpha' } ) );
				expect( await getSelectedTab() ).toHaveTextContent( 'Alpha' );
				expect( mockOnSelect ).toHaveBeenLastCalledWith( 'alpha' );

				const TABS_WITH_ALPHA_DISABLED = TABS.map( ( tabObj ) =>
					tabObj.tabId === 'alpha'
						? {
								...tabObj,
								tab: {
									...tabObj.tab,
									disabled: true,
								},
						  }
						: tabObj
				);

				await rerender(
					<UncontrolledTabs
						tabs={ TABS_WITH_ALPHA_DISABLED }
						defaultTabId="gamma"
						onSelect={ mockOnSelect }
					/>
				);

				expect( await getSelectedTab() ).toHaveTextContent( 'Gamma' );
			} );

			it( 'should have no active tabs when the tab associated to `defaultTabId` is removed while being the active tab', async () => {
				const { rerender } = await render(
					<UncontrolledTabs tabs={ TABS } defaultTabId="gamma" />
				);

				expect( await getSelectedTab() ).toHaveTextContent( 'Gamma' );

				// Remove gamma
				await rerender(
					<UncontrolledTabs
						tabs={ TABS.slice( 0, 2 ) }
						defaultTabId="gamma"
					/>
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

			it( 'waits for the tab with the `defaultTabId` to be present in the `tabs` array before selecting it', async () => {
				const { rerender } = await render(
					<UncontrolledTabs tabs={ TABS } defaultTabId="delta" />
				);

				// There should be no selected tab yet.
				expect(
					screen.queryByRole( 'tab', { selected: true } )
				).not.toBeInTheDocument();

				await rerender(
					<UncontrolledTabs
						tabs={ TABS_WITH_DELTA }
						defaultTabId="delta"
					/>
				);

				expect( await getSelectedTab() ).toHaveTextContent( 'Delta' );
			} );
		} );

		describe( 'Disabled tab', () => {
			it( 'should disable the tab when `disabled` is `true`', async () => {
				const mockOnSelect = jest.fn();

				const TABS_WITH_DELTA_DISABLED = TABS_WITH_DELTA.map(
					( tabObj ) =>
						tabObj.tabId === 'delta'
							? {
									...tabObj,
									tab: {
										...tabObj.tab,
										disabled: true,
									},
							  }
							: tabObj
				);

				await render(
					<UncontrolledTabs
						tabs={ TABS_WITH_DELTA_DISABLED }
						onSelect={ mockOnSelect }
					/>
				);

				expect(
					screen.getByRole( 'tab', { name: 'Delta' } )
				).toHaveAttribute( 'aria-disabled', 'true' );

				// onSelect gets called on the initial render.
				expect( mockOnSelect ).toHaveBeenCalledTimes( 1 );
				expect( mockOnSelect ).toHaveBeenLastCalledWith( 'alpha' );

				// Move focus to the tablist, make sure alpha is focused.
				await press.Tab();
				expect(
					screen.getByRole( 'tab', { name: 'Alpha' } )
				).toHaveFocus();

				// onSelect should not be called since the disabled tab is
				// highlighted, but not selected.
				await press.ArrowLeft();
				expect( mockOnSelect ).toHaveBeenCalledTimes( 1 );

				// Delta (which is disabled) has focus
				expect(
					screen.getByRole( 'tab', { name: 'Delta' } )
				).toHaveFocus();

				// Alpha retains the selection, even if it's not focused.
				expect( await getSelectedTab() ).toHaveTextContent( 'Alpha' );
			} );

			it( 'should select first enabled tab when the initial tab is disabled', async () => {
				const TABS_WITH_ALPHA_DISABLED = TABS.map( ( tabObj ) =>
					tabObj.tabId === 'alpha'
						? {
								...tabObj,
								tab: {
									...tabObj.tab,
									disabled: true,
								},
						  }
						: tabObj
				);

				const { rerender } = await render(
					<UncontrolledTabs tabs={ TABS_WITH_ALPHA_DISABLED } />
				);

				// As alpha (first tab) is disabled,
				// the first enabled tab should be beta.
				expect( await getSelectedTab() ).toHaveTextContent( 'Beta' );

				// Re-enable all tabs
				await rerender( <UncontrolledTabs tabs={ TABS } /> );

				// Even if the initial tab becomes enabled again, the selected
				// tab doesn't change.
				expect( await getSelectedTab() ).toHaveTextContent( 'Beta' );
			} );

			it( 'should select first enabled tab when the tab associated to `defaultTabId` is disabled', async () => {
				const TABS_ONLY_GAMMA_ENABLED = TABS.map( ( tabObj ) =>
					tabObj.tabId !== 'gamma'
						? {
								...tabObj,
								tab: {
									...tabObj.tab,
									disabled: true,
								},
						  }
						: tabObj
				);
				const { rerender } = await render(
					<UncontrolledTabs
						tabs={ TABS_ONLY_GAMMA_ENABLED }
						defaultTabId="beta"
					/>
				);

				// As alpha (first tab), and beta (the initial tab), are both
				// disabled the first enabled tab should be gamma.
				expect( await getSelectedTab() ).toHaveTextContent( 'Gamma' );

				// Re-enable all tabs
				await rerender(
					<UncontrolledTabs tabs={ TABS } defaultTabId="beta" />
				);

				// Even if the initial tab becomes enabled again, the selected tab doesn't
				// change.
				expect( await getSelectedTab() ).toHaveTextContent( 'Gamma' );
			} );

			it( 'should select the first enabled tab when the selected tab becomes disabled', async () => {
				const mockOnSelect = jest.fn();
				const { rerender } = await render(
					<UncontrolledTabs tabs={ TABS } onSelect={ mockOnSelect } />
				);

				expect( await getSelectedTab() ).toHaveTextContent( 'Alpha' );
				expect( mockOnSelect ).toHaveBeenCalledTimes( 1 );
				expect( mockOnSelect ).toHaveBeenLastCalledWith( 'alpha' );

				const TABS_WITH_ALPHA_DISABLED = TABS.map( ( tabObj ) =>
					tabObj.tabId === 'alpha'
						? {
								...tabObj,
								tab: {
									...tabObj.tab,
									disabled: true,
								},
						  }
						: tabObj
				);

				// Disable alpha
				await rerender(
					<UncontrolledTabs
						tabs={ TABS_WITH_ALPHA_DISABLED }
						onSelect={ mockOnSelect }
					/>
				);

				expect( await getSelectedTab() ).toHaveTextContent( 'Beta' );
				expect( mockOnSelect ).toHaveBeenCalledTimes( 2 );
				expect( mockOnSelect ).toHaveBeenLastCalledWith( 'beta' );

				// Re-enable all tabs
				await rerender(
					<UncontrolledTabs tabs={ TABS } onSelect={ mockOnSelect } />
				);

				expect( await getSelectedTab() ).toHaveTextContent( 'Beta' );
				expect( mockOnSelect ).toHaveBeenCalledTimes( 2 );
				expect( mockOnSelect ).toHaveBeenLastCalledWith( 'beta' );
			} );

			it( 'should select the first enabled tab when the tab associated to `defaultTabId` becomes disabled while being the active tab', async () => {
				const mockOnSelect = jest.fn();

				const { rerender } = await render(
					<UncontrolledTabs
						tabs={ TABS }
						onSelect={ mockOnSelect }
						defaultTabId="gamma"
					/>
				);

				expect( await getSelectedTab() ).toHaveTextContent( 'Gamma' );

				const TABS_WITH_GAMMA_DISABLED = TABS.map( ( tabObj ) =>
					tabObj.tabId === 'gamma'
						? {
								...tabObj,
								tab: {
									...tabObj.tab,
									disabled: true,
								},
						  }
						: tabObj
				);

				// Disable gamma
				await rerender(
					<UncontrolledTabs
						tabs={ TABS_WITH_GAMMA_DISABLED }
						onSelect={ mockOnSelect }
						defaultTabId="gamma"
					/>
				);

				expect( await getSelectedTab() ).toHaveTextContent( 'Alpha' );
				expect( mockOnSelect ).toHaveBeenCalledTimes( 1 );
				expect( mockOnSelect ).toHaveBeenLastCalledWith( 'alpha' );

				// Re-enable all tabs
				await rerender(
					<UncontrolledTabs
						tabs={ TABS }
						onSelect={ mockOnSelect }
						defaultTabId="gamma"
					/>
				);

				// Confirm that alpha is still selected, and that onSelect has
				// not been called again.
				expect( await getSelectedTab() ).toHaveTextContent( 'Alpha' );
				expect( mockOnSelect ).toHaveBeenCalledTimes( 1 );
			} );
		} );
	} );

	describe( 'Controlled mode', () => {
		it( 'should render the tab specified by the `selectedTabId` prop', async () => {
			await render(
				<ControlledTabs tabs={ TABS } selectedTabId="beta" />
			);

			expect( await getSelectedTab() ).toHaveTextContent( 'Beta' );
			expect(
				await screen.findByRole( 'tabpanel', { name: 'Beta' } )
			).toBeInTheDocument();
		} );
		it( 'should render the specified `selectedTabId`, and ignore the `defaultTabId` prop', async () => {
			await render(
				<ControlledTabs
					tabs={ TABS }
					selectedTabId="gamma"
					defaultTabId="beta"
				/>
			);

			expect( await getSelectedTab() ).toHaveTextContent( 'Gamma' );
		} );
		it( 'should not render any tab if `selectedTabId` does not match any known tab', async () => {
			await render(
				<ControlledTabs
					tabs={ TABS_WITH_DELTA }
					selectedTabId="does-not-exist"
				/>
			);

			expect(
				screen.queryByRole( 'tab', { selected: true } )
			).not.toBeInTheDocument();

			// No tabpanel should be rendered either
			expect( screen.queryByRole( 'tabpanel' ) ).not.toBeInTheDocument();
		} );
		it( 'should not render any tab if the active tab is removed', async () => {
			const { rerender } = await render(
				<ControlledTabs tabs={ TABS } selectedTabId="beta" />
			);

			// Remove beta
			await rerender(
				<ControlledTabs
					tabs={ TABS.filter( ( tab ) => tab.tabId !== 'beta' ) }
					selectedTabId="beta"
				/>
			);

			expect( screen.getAllByRole( 'tab' ) ).toHaveLength( 2 );

			// No tab should be selected i.e. it doesn't fall back to first tab.
			// `waitFor` is needed here to prevent testing library from
			// throwing a 'not wrapped in `act()`' error.
			await waitFor( () =>
				expect(
					screen.queryByRole( 'tab', { selected: true } )
				).not.toBeInTheDocument()
			);
			// No tabpanel should be rendered either
			expect( screen.queryByRole( 'tabpanel' ) ).not.toBeInTheDocument();

			// Restore beta
			await rerender(
				<ControlledTabs tabs={ TABS } selectedTabId="beta" />
			);

			// No tab should be selected i.e. it doesn't reselect the previously
			// removed tab.
			expect(
				screen.queryByRole( 'tab', { selected: true } )
			).not.toBeInTheDocument();
			// No tabpanel should be rendered either
			expect( screen.queryByRole( 'tabpanel' ) ).not.toBeInTheDocument();
		} );

		describe( 'Disabled tab', () => {
			it( 'should not render any tab if `selectedTabId` refers to a disabled tab', async () => {
				const TABS_WITH_DELTA_WITH_BETA_DISABLED = TABS_WITH_DELTA.map(
					( tabObj ) =>
						tabObj.tabId === 'beta'
							? {
									...tabObj,
									tab: {
										...tabObj.tab,
										disabled: true,
									},
							  }
							: tabObj
				);

				await render(
					<ControlledTabs
						tabs={ TABS_WITH_DELTA_WITH_BETA_DISABLED }
						selectedTabId="beta"
					/>
				);

				// No tab should be selected i.e. it doesn't fall back to first tab.
				await waitFor( () => {
					expect(
						screen.queryByRole( 'tab', { selected: true } )
					).not.toBeInTheDocument();
				} );
				// No tabpanel should be rendered either
				expect(
					screen.queryByRole( 'tabpanel' )
				).not.toBeInTheDocument();
			} );
			it( 'should not render any tab when the selected tab becomes disabled', async () => {
				const { rerender } = await render(
					<ControlledTabs tabs={ TABS } selectedTabId="beta" />
				);

				expect( await getSelectedTab() ).toHaveTextContent( 'Beta' );

				const TABS_WITH_BETA_DISABLED = TABS.map( ( tabObj ) =>
					tabObj.tabId === 'beta'
						? {
								...tabObj,
								tab: {
									...tabObj.tab,
									disabled: true,
								},
						  }
						: tabObj
				);

				await rerender(
					<ControlledTabs
						tabs={ TABS_WITH_BETA_DISABLED }
						selectedTabId="beta"
					/>
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
				await rerender(
					<ControlledTabs tabs={ TABS } selectedTabId="beta" />
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
		describe( 'When `selectedId` is changed by the controlling component', () => {
			describe.each( [ true, false ] )(
				'and `selectOnMove` is %s',
				( selectOnMove ) => {
					it( 'should continue to handle arrow key navigation properly', async () => {
						const { rerender } = await render(
							<ControlledTabs
								tabs={ TABS }
								selectedTabId="beta"
								selectOnMove={ selectOnMove }
							/>
						);

						// Tab key should focus the currently selected tab, which is Beta.
						await press.Tab();
						await waitFor( async () =>
							expect( await getSelectedTab() ).toHaveTextContent(
								'Beta'
							)
						);
						expect( await getSelectedTab() ).toHaveFocus();

						await rerender(
							<ControlledTabs
								tabs={ TABS }
								selectedTabId="gamma"
								selectOnMove={ selectOnMove }
							/>
						);

						// When the selected tab is changed, it should not automatically receive focus.

						expect( await getSelectedTab() ).toHaveTextContent(
							'Gamma'
						);

						expect(
							screen.getByRole( 'tab', { name: 'Beta' } )
						).toHaveFocus();

						// Arrow keys should move focus to the next tab, which is Gamma
						await press.ArrowRight();
						expect(
							screen.getByRole( 'tab', { name: 'Gamma' } )
						).toHaveFocus();
					} );

					it( 'should focus the correct tab when tabbing out and back into the tablist', async () => {
						const { rerender } = await render(
							<>
								<button>Focus me</button>
								<ControlledTabs
									tabs={ TABS }
									selectedTabId="beta"
									selectOnMove={ selectOnMove }
								/>
							</>
						);

						// Tab key should focus the currently selected tab, which is Beta.
						await press.Tab();
						await press.Tab();
						expect( await getSelectedTab() ).toHaveTextContent(
							'Beta'
						);
						expect( await getSelectedTab() ).toHaveFocus();

						await rerender(
							<>
								<button>Focus me</button>
								<ControlledTabs
									tabs={ TABS }
									selectedTabId="gamma"
									selectOnMove={ selectOnMove }
								/>
							</>
						);

						// When the selected tab is changed, it should not automatically receive focus.

						expect( await getSelectedTab() ).toHaveTextContent(
							'Gamma'
						);

						expect(
							screen.getByRole( 'tab', { name: 'Beta' } )
						).toHaveFocus();

						// Press shift+tab, move focus to the button before Tabs
						await press.ShiftTab();
						expect(
							screen.getByRole( 'button', { name: 'Focus me' } )
						).toHaveFocus();

						// Press tab, move focus back to the tablist
						await press.Tab();

						const betaTab = screen.getByRole( 'tab', {
							name: 'Beta',
						} );
						const gammaTab = screen.getByRole( 'tab', {
							name: 'Gamma',
						} );

						expect(
							selectOnMove ? gammaTab : betaTab
						).toHaveFocus();
					} );
				}
			);
		} );

		describe( 'When `selectOnMove` is `true`', () => {
			it( 'should automatically select a newly focused tab', async () => {
				await render(
					<ControlledTabs tabs={ TABS } selectedTabId="beta" />
				);

				await press.Tab();

				// Tab key should focus the currently selected tab, which is Beta.
				expect( await getSelectedTab() ).toHaveTextContent( 'Beta' );
				expect( await getSelectedTab() ).toHaveFocus();

				// Arrow keys should select and move focus to the next tab.
				await press.ArrowRight();
				expect( await getSelectedTab() ).toHaveTextContent( 'Gamma' );
				expect( await getSelectedTab() ).toHaveFocus();
			} );
		} );
		describe( 'When `selectOnMove` is `false`', () => {
			it( 'should apply focus without automatically changing the selected tab', async () => {
				await render(
					<ControlledTabs
						tabs={ TABS }
						selectedTabId="beta"
						selectOnMove={ false }
					/>
				);

				expect( await getSelectedTab() ).toHaveTextContent( 'Beta' );

				// Tab key should focus the currently selected tab, which is Beta.
				await press.Tab();
				await waitFor( async () =>
					expect(
						await screen.findByRole( 'tab', { name: 'Beta' } )
					).toHaveFocus()
				);

				// Arrow key should move focus but not automatically change the selected tab.
				await press.ArrowRight();
				expect(
					screen.getByRole( 'tab', { name: 'Gamma' } )
				).toHaveFocus();
				expect( await getSelectedTab() ).toHaveTextContent( 'Beta' );

				// Pressing the spacebar should select the focused tab.
				await press.Space();
				expect( await getSelectedTab() ).toHaveTextContent( 'Gamma' );

				// Arrow key should move focus but not automatically change the selected tab.
				await press.ArrowRight();
				expect(
					screen.getByRole( 'tab', { name: 'Alpha' } )
				).toHaveFocus();
				expect( await getSelectedTab() ).toHaveTextContent( 'Gamma' );

				// Pressing the enter/return should select the focused tab.
				await press.Enter();
				expect( await getSelectedTab() ).toHaveTextContent( 'Alpha' );
			} );
		} );
	} );
	it( 'should associate each `Tab` with the correct `TabPanel`, even if they are not rendered in the same order', async () => {
		const TABS_WITH_DELTA_REVERSED = [ ...TABS_WITH_DELTA ].reverse();

		await render(
			<Tabs>
				<Tabs.TabList>
					{ TABS_WITH_DELTA.map( ( tabObj ) => (
						<Tabs.Tab
							key={ tabObj.tabId }
							tabId={ tabObj.tabId }
							className={ tabObj.tab.className }
							disabled={ tabObj.tab.disabled }
						>
							{ tabObj.title }
						</Tabs.Tab>
					) ) }
				</Tabs.TabList>
				{ TABS_WITH_DELTA_REVERSED.map( ( tabObj ) => (
					<Tabs.TabPanel
						key={ tabObj.tabId }
						tabId={ tabObj.tabId }
						focusable={ tabObj.tabpanel?.focusable }
					>
						{ tabObj.content }
					</Tabs.TabPanel>
				) ) }
			</Tabs>
		);

		// Alpha is the initially selected tab,and should render the correct tabpanel
		expect( await getSelectedTab() ).toHaveTextContent( 'Alpha' );
		expect( screen.getByRole( 'tabpanel' ) ).toHaveTextContent(
			'Selected tab: Alpha'
		);

		// Select Beta, make sure the correct tabpanel is rendered
		await click( screen.getByRole( 'tab', { name: 'Beta' } ) );
		expect( await getSelectedTab() ).toHaveTextContent( 'Beta' );
		expect( screen.getByRole( 'tabpanel' ) ).toHaveTextContent(
			'Selected tab: Beta'
		);

		// Select Gamma, make sure the correct tabpanel is rendered
		await click( screen.getByRole( 'tab', { name: 'Gamma' } ) );
		expect( await getSelectedTab() ).toHaveTextContent( 'Gamma' );
		expect( screen.getByRole( 'tabpanel' ) ).toHaveTextContent(
			'Selected tab: Gamma'
		);

		// Select Delta, make sure the correct tabpanel is rendered
		await click( screen.getByRole( 'tab', { name: 'Delta' } ) );
		expect( await getSelectedTab() ).toHaveTextContent( 'Delta' );
		expect( screen.getByRole( 'tabpanel' ) ).toHaveTextContent(
			'Selected tab: Delta'
		);
	} );
} );
