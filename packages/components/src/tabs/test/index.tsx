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

	describe( 'Adherence to spec and basic behavior', () => {
		it( 'should apply the correct roles, semantics and attributes', async () => {
			await render( <UncontrolledTabs tabs={ TABS } /> );

			// Waiting for a tab to be selected is a sign that the component
			// has fully initialized.
			// Alpha is automatically selected as the selected tab.
			expect(
				await screen.findByRole( 'tab', {
					selected: true,
					name: 'Alpha',
				} )
			).toBeVisible();

			const tabList = screen.getByRole( 'tablist' );
			const allTabs = screen.getAllByRole( 'tab' );
			const allTabpanels = screen.getAllByRole( 'tabpanel' );

			expect( tabList ).toBeVisible();
			expect( tabList ).toHaveAttribute(
				'aria-orientation',
				'horizontal'
			);

			expect( allTabs ).toHaveLength( TABS.length );

			// Only 1 tab panel is accessible — the one associated with the
			// selected tab. The selected `tab` aria-controls the active
			/// `tabpanel`, which is `aria-labelledby` the selected `tab`.
			expect( allTabpanels ).toHaveLength( 1 );

			expect( allTabpanels[ 0 ] ).toBeVisible();
			expect( allTabs[ 0 ] ).toHaveAttribute(
				'aria-controls',
				allTabpanels[ 0 ].getAttribute( 'id' )
			);
			expect( allTabpanels[ 0 ] ).toHaveAttribute(
				'aria-labelledby',
				allTabs[ 0 ].getAttribute( 'id' )
			);
		} );
	} );

	describe( 'keyboard interactions', () => {
		it( 'should handle the tablist as one tab stop', async () => {
			await render( <UncontrolledTabs tabs={ TABS } /> );

			// Waiting for a tab to be selected is a sign that the component
			// has fully initialized.
			// Alpha is automatically selected as the selected tab.
			expect(
				await screen.findByRole( 'tab', {
					selected: true,
					name: 'Alpha',
				} )
			).toBeVisible();

			// Press tab. The selected tab (alpha) received focus.
			await press.Tab();
			expect(
				await screen.findByRole( 'tab', {
					selected: true,
					name: 'Alpha',
				} )
			).toHaveFocus();

			// By default the tabpanel should receive focus
			await press.Tab();
			expect(
				await screen.findByRole( 'tabpanel', {
					name: 'Alpha',
				} )
			).toHaveFocus();
		} );

		it( 'should not focus the tabpanel container when its `focusable` property is set to `false`', async () => {
			await render(
				<UncontrolledTabs
					tabs={ TABS.map( ( tabObj ) =>
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
					) }
				/>
			);

			// Waiting for a tab to be selected is a sign that the component
			// has fully initialized.
			// Alpha is automatically selected as the selected tab.
			expect(
				await screen.findByRole( 'tab', {
					selected: true,
					name: 'Alpha',
				} )
			).toBeVisible();

			// Tab should initially focus the first tab in the tablist, which
			// is Alpha.
			await press.Tab();
			expect(
				await screen.findByRole( 'tab', {
					selected: true,
					name: 'Alpha',
				} )
			).toHaveFocus();

			// In this case, the tabpanel container is skipped and focus is
			// moved directly to its contents
			await press.Tab();
			expect(
				await screen.findByRole( 'button', {
					name: 'Alpha Button',
				} )
			).toHaveFocus();
		} );

		it( 'should focus tabs in the tablist even if disabled', async () => {
			await render(
				<UncontrolledTabs tabs={ TABS_WITH_BETA_DISABLED } />
			);

			// Waiting for a tab to be selected is a sign that the component
			// has fully initialized.
			// Alpha is automatically selected as the selected tab.
			expect(
				await screen.findByRole( 'tab', {
					selected: true,
					name: 'Alpha',
				} )
			).toBeVisible();

			// Tab should initially focus the first tab in the tablist, which
			// is Alpha.
			await press.Tab();
			expect(
				await screen.findByRole( 'tab', {
					selected: true,
					name: 'Alpha',
				} )
			).toHaveFocus();

			// By default the tabpanel should receive focus
			await press.Tab();
			expect(
				await screen.findByRole( 'tabpanel', {
					name: 'Alpha',
				} )
			).toHaveFocus();
		} );
	} );

	describe( 'initial tab selection', () => {
		describe( 'when a selected tab id is not specified', () => {
			describe( 'when left `undefined` [Uncontrolled]', () => {
				it( 'should choose the first tab as selected', async () => {
					await render( <UncontrolledTabs tabs={ TABS } /> );

					// Waiting for a tab to be selected is a sign that the component
					// has fully initialized.
					// Alpha is automatically selected as the selected tab.
					// The corresponding tabpanel is shown.
					expect(
						await screen.findByRole( 'tab', {
							selected: true,
							name: 'Alpha',
						} )
					).toBeVisible();
					expect(
						screen.getByRole( 'tabpanel', {
							name: 'Alpha',
						} )
					).toBeVisible();

					// Press tab. The selected tab (alpha) received focus.
					await press.Tab();
					expect(
						await screen.findByRole( 'tab', {
							selected: true,
							name: 'Alpha',
						} )
					).toHaveFocus();
				} );

				it( 'should choose the first non-disabled tab if the first tab is disabled', async () => {
					await render(
						<UncontrolledTabs tabs={ TABS_WITH_ALPHA_DISABLED } />
					);

					// Waiting for a tab to be selected is a sign that the component
					// has fully initialized.
					// Beta is automatically selected as the selected tab, since alpha is
					// disabled.
					// The corresponding tabpanel is shown.
					expect(
						await screen.findByRole( 'tab', {
							selected: true,
							name: 'Beta',
						} )
					).toBeVisible();
					expect(
						screen.getByRole( 'tabpanel', {
							name: 'Beta',
						} )
					).toBeVisible();

					// Press tab. The selected tab (beta) received focus. The corresponding
					// tabpanel is shown.
					await press.Tab();
					expect(
						await screen.findByRole( 'tab', {
							selected: true,
							name: 'Beta',
						} )
					).toHaveFocus();
				} );
			} );
			describe( 'when `null` [Controlled]', () => {
				it( 'should not have a selected tab nor show any tabpanels, make the tablist tabbable and still allow selecting tabs', async () => {
					await render(
						<ControlledTabs tabs={ TABS } selectedTabId={ null } />
					);

					// Wait for the tablist to be tabbable as a mean to know
					// that ariakit has finished initializing.
					await waitFor( () =>
						expect( screen.getByRole( 'tablist' ) ).toHaveAttribute(
							'tabindex',
							'0'
						)
					);
					// No initially selected tabs or tabpanels.
					await waitFor( () =>
						expect(
							screen.queryByRole( 'tab', { selected: true } )
						).not.toBeInTheDocument()
					);
					await waitFor( () =>
						expect(
							screen.queryByRole( 'tabpanel' )
						).not.toBeInTheDocument()
					);

					// Press tab. The tablist receives focus
					await press.Tab();
					expect(
						await screen.findByRole( 'tablist' )
					).toHaveFocus();

					// Press right arrow to select the first tab (alpha) and
					// show the related tabpanel.
					await press.ArrowRight();
					expect(
						await screen.findByRole( 'tab', {
							selected: true,
							name: 'Alpha',
						} )
					).toHaveFocus();
					expect(
						await screen.findByRole( 'tabpanel', {
							name: 'Alpha',
						} )
					).toBeVisible();
				} );
			} );
		} );

		describe( 'when a selected tab id is specified', () => {
			describe( 'through the `defaultTabId` prop [Uncontrolled]', () => {
				it( 'should select the initial tab matching the `defaultTabId`', async () => {
					await render(
						<UncontrolledTabs tabs={ TABS } defaultTabId="beta" />
					);

					// Waiting for a tab to be selected is a sign that the component
					// has fully initialized.
					// Beta is automatically selected as the selected tab.
					// The corresponding tabpanel is shown.
					expect(
						await screen.findByRole( 'tab', {
							selected: true,
							name: 'Beta',
						} )
					).toBeVisible();
					expect(
						screen.getByRole( 'tabpanel', {
							name: 'Beta',
						} )
					).toBeVisible();

					// Press tab. The selected tab (beta) received focus. The corresponding
					// tabpanel is shown.
					await press.Tab();
					expect(
						await screen.findByRole( 'tab', {
							selected: true,
							name: 'Beta',
						} )
					).toHaveFocus();
				} );

				it( 'should select the initial tab matching the `defaultTabId` even if the tab is disabled', async () => {
					await render(
						<UncontrolledTabs
							tabs={ TABS_WITH_BETA_DISABLED }
							defaultTabId="beta"
						/>
					);

					// Waiting for a tab to be selected is a sign that the component
					// has fully initialized.
					// Beta is automatically selected as the selected tab despite being
					// disabled, respecting the `defaultTabId` prop.
					// The corresponding tabpanel is shown.
					expect(
						await screen.findByRole( 'tab', {
							selected: true,
							name: 'Beta',
						} )
					).toBeVisible();
					expect(
						screen.getByRole( 'tabpanel', {
							name: 'Beta',
						} )
					).toBeVisible();

					// Press tab. The selected tab (beta) received focus, since it is
					// accessible despite being disabled.
					await press.Tab();
					expect(
						await screen.findByRole( 'tab', {
							selected: true,
							name: 'Beta',
						} )
					).toHaveFocus();
				} );
			} );

			describe( 'through the `selectedTabId` prop [Controlled]', () => {
				describe( 'when the `selectedTabId` matches an existing tab', () => {
					it( 'should chose the initial tab matching the `selectedTabId`', async () => {
						await render(
							<ControlledTabs
								tabs={ TABS }
								selectedTabId="beta"
							/>
						);

						// Waiting for a tab to be selected is a sign that the component
						// has fully initialized.
						// Beta is automatically selected as the selected tab.
						// The corresponding tabpanel is shown.
						expect(
							await screen.findByRole( 'tab', {
								selected: true,
								name: 'Beta',
							} )
						).toBeVisible();
						expect(
							screen.getByRole( 'tabpanel', {
								name: 'Beta',
							} )
						).toBeVisible();

						// Press tab. The selected tab (beta) received focus, since it is
						// accessible despite being disabled.
						await press.Tab();
						expect(
							await screen.findByRole( 'tab', {
								selected: true,
								name: 'Beta',
							} )
						).toHaveFocus();
					} );

					it( 'should chose the initial tab matching the `selectedTabId` even if a `defaultTabId` is passed', async () => {
						await render(
							<ControlledTabs
								tabs={ TABS }
								defaultTabId="beta"
								selectedTabId="gamma"
							/>
						);

						// Waiting for a tab to be selected is a sign that the component
						// has fully initialized.
						// Gamma is automatically selected as the selected tab.
						// The corresponding tabpanel is shown.
						expect(
							await screen.findByRole( 'tab', {
								selected: true,
								name: 'Gamma',
							} )
						).toBeVisible();
						expect(
							screen.getByRole( 'tabpanel', {
								name: 'Gamma',
							} )
						).toBeVisible();

						// Press tab. The selected tab (gamma) received focus, since it is
						// accessible despite being disabled.
						await press.Tab();
						expect(
							await screen.findByRole( 'tab', {
								selected: true,
								name: 'Gamma',
							} )
						).toHaveFocus();
					} );

					it( 'should chose the initial tab matching the `selectedTabId` even if the tab is disabled', async () => {
						await render(
							<ControlledTabs
								tabs={ TABS_WITH_BETA_DISABLED }
								selectedTabId="beta"
							/>
						);

						// Waiting for a tab to be selected is a sign that the component
						// has fully initialized.
						// Beta is automatically selected as the selected tab despite being
						// disabled, respecting the `defaultTabId` prop.
						// The corresponding tabpanel is shown.
						expect(
							await screen.findByRole( 'tab', {
								selected: true,
								name: 'Beta',
							} )
						).toBeVisible();
						expect(
							screen.getByRole( 'tabpanel', {
								name: 'Beta',
							} )
						).toBeVisible();

						// Press tab. The selected tab (beta) received focus, since it is
						// accessible despite being disabled.
						await press.Tab();
						expect(
							await screen.findByRole( 'tab', {
								selected: true,
								name: 'Beta',
							} )
						).toHaveFocus();
					} );
				} );

				describe( "when the `selectedTabId` doesn't matches an existing tab", () => {
					it( 'should not have a selected tab nor show any tabpanels, but allow tabbing to the first tab', async () => {
						await render(
							<UncontrolledTabs
								tabs={ TABS }
								defaultTabId="non-existing-tab"
							/>
						);

						// Wait for the tablist to be tabbable as a mean to know
						// that ariakit has finished initializing.
						await waitFor( () =>
							expect(
								screen.getByRole( 'tablist' )
							).toHaveAttribute( 'tabindex', '-1' )
						);
						// No initially selected tabs or tabpanels.
						await waitFor( () =>
							expect(
								screen.queryByRole( 'tab', { selected: true } )
							).not.toBeInTheDocument()
						);
						await waitFor( () =>
							expect(
								screen.queryByRole( 'tabpanel' )
							).not.toBeInTheDocument()
						);

						// Press tab. The first tab receives focus, but it's
						// not selected.
						await press.Tab();
						expect(
							screen.getByRole( 'tab', { name: 'Alpha' } )
						).toHaveFocus();
						await waitFor( () =>
							expect(
								screen.queryByRole( 'tab', { selected: true } )
							).not.toBeInTheDocument()
						);
						await waitFor( () =>
							expect(
								screen.queryByRole( 'tabpanel' )
							).not.toBeInTheDocument()
						);

						// Press right arrow to select the next tab (beta) and
						// show the related tabpanel.
						await press.ArrowRight();
						expect(
							await screen.findByRole( 'tab', {
								selected: true,
								name: 'Beta',
							} )
						).toHaveFocus();
						expect(
							await screen.findByRole( 'tabpanel', {
								name: 'Beta',
							} )
						).toBeVisible();
					} );

					it( 'should not have a selected tab nor show any tabpanels, but allow tabbing to the first tab even when disabled', async () => {
						await render(
							<UncontrolledTabs
								tabs={ TABS_WITH_ALPHA_DISABLED }
								defaultTabId="non-existing-tab"
							/>
						);

						// Wait for the tablist to be tabbable as a mean to know
						// that ariakit has finished initializing.
						await waitFor( () =>
							expect(
								screen.getByRole( 'tablist' )
							).toHaveAttribute( 'tabindex', '-1' )
						);
						// No initially selected tabs or tabpanels.
						await waitFor( () =>
							expect(
								screen.queryByRole( 'tab', { selected: true } )
							).not.toBeInTheDocument()
						);
						await waitFor( () =>
							expect(
								screen.queryByRole( 'tabpanel' )
							).not.toBeInTheDocument()
						);

						// Press tab. The first tab receives focus, but it's
						// not selected.
						await press.Tab();
						expect(
							screen.getByRole( 'tab', { name: 'Alpha' } )
						).toHaveFocus();
						await waitFor( () =>
							expect(
								screen.queryByRole( 'tab', { selected: true } )
							).not.toBeInTheDocument()
						);
						await waitFor( () =>
							expect(
								screen.queryByRole( 'tabpanel' )
							).not.toBeInTheDocument()
						);

						// Press right arrow to select the next tab (beta) and
						// show the related tabpanel.
						await press.ArrowRight();
						expect(
							await screen.findByRole( 'tab', {
								selected: true,
								name: 'Beta',
							} )
						).toHaveFocus();
						expect(
							await screen.findByRole( 'tabpanel', {
								name: 'Beta',
							} )
						).toBeVisible();
					} );
				} );
			} );
		} );
	} );
} );
