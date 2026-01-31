/* eslint-disable jest/no-conditional-expect */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DirectionProvider } from '@base-ui/react/direction-provider';
import { useEffect, useState, createRef } from '@wordpress/element';
import { Tabs } from '../..';
import type { TabRootProps } from '../types';

type Tab = {
	value: string;
	title: string;
	content: React.ReactNode;
	tab: {
		className?: string;
		disabled?: boolean;
	};
	tabpanel?: {
		tabIndex?: number;
	};
};

const TABS: Tab[] = [
	{
		value: 'alpha',
		title: 'Alpha',
		content: 'Selected tab: Alpha',
		tab: { className: 'alpha-class' },
	},
	{
		value: 'beta',
		title: 'Beta',
		content: 'Selected tab: Beta',
		tab: { className: 'beta-class' },
	},
	{
		value: 'gamma',
		title: 'Gamma',
		content: 'Selected tab: Gamma',
		tab: { className: 'gamma-class' },
	},
];

const TABS_WITH_ALPHA_DISABLED = TABS.map( ( tabObj ) =>
	tabObj.value === 'alpha'
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
	tabObj.value === 'beta'
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
		value: 'delta',
		title: 'Delta',
		content: 'Selected tab: Delta',
		tab: { className: 'delta-class' },
	},
];

const UncontrolledTabs = ( {
	tabs,
	selectOnMove,
	...props
}: Omit< TabRootProps, 'children' | 'tabs' > & {
	tabs: Tab[];
	selectOnMove?: boolean;
} ) => {
	return (
		<Tabs.Root { ...props }>
			<Tabs.List activateOnFocus={ selectOnMove }>
				{ tabs.map( ( tabObj, index ) => (
					<Tabs.Tab
						key={ `${ tabObj.title }-${ index }` }
						value={ tabObj.value }
						className={ tabObj.tab.className }
						disabled={ tabObj.tab.disabled }
					>
						{ tabObj.title }
					</Tabs.Tab>
				) ) }
			</Tabs.List>
			{ tabs.map( ( tabObj, index ) => (
				<Tabs.Panel
					key={ `${ tabObj.title }-${ index }` }
					value={ tabObj.value }
					// Only apply tabIndex if defined, otherwise fallback
					// to default internal implementation
					{ ...( tabObj.tabpanel?.tabIndex !== undefined && {
						tabIndex: tabObj.tabpanel.tabIndex,
					} ) }
				>
					{ tabObj.content }
				</Tabs.Panel>
			) ) }
		</Tabs.Root>
	);
};

const ControlledTabs = ( {
	tabs,
	selectOnMove,
	...props
}: Omit< TabRootProps, 'children' | 'tabs' > & {
	tabs: Tab[];
	selectOnMove?: boolean;
} ) => {
	const [ value, setValue ] = useState( props.value ?? null );

	useEffect( () => {
		setValue( props.value ?? null );
	}, [ props.value ] );

	return (
		<Tabs.Root
			{ ...props }
			value={ value }
			onValueChange={ ( selectedId, event ) => {
				setValue( selectedId );
				props.onValueChange?.( selectedId, event );
			} }
		>
			<Tabs.List activateOnFocus={ selectOnMove }>
				{ tabs.map( ( tabObj, index ) => (
					<Tabs.Tab
						key={ `${ tabObj.title }-${ index }` }
						value={ tabObj.value }
						className={ tabObj.tab.className }
						disabled={ tabObj.tab.disabled }
					>
						{ tabObj.title }
					</Tabs.Tab>
				) ) }
			</Tabs.List>
			{ tabs.map( ( tabObj, index ) => (
				<Tabs.Panel
					key={ `${ tabObj.title }-${ index }` }
					value={ tabObj.value }
					// Only apply tabIndex if defined, otherwise fallback
					// to default internal implementation
					{ ...( tabObj.tabpanel?.tabIndex !== undefined && {
						tabIndex: tabObj.tabpanel.tabIndex,
					} ) }
				>
					{ tabObj.content }
				</Tabs.Panel>
			) ) }
		</Tabs.Root>
	);
};

async function waitForComponentToBeInitializedWithSelectedTab(
	selectedTabName: string | undefined
) {
	if ( ! selectedTabName ) {
		// No initially selected tabs or tabpanels.
		await waitFor( () =>
			expect(
				screen.queryByRole( 'tab', { selected: true } )
			).not.toBeInTheDocument()
		);
		await waitFor( () =>
			expect( screen.queryByRole( 'tabpanel' ) ).not.toBeInTheDocument()
		);
	} else {
		// Waiting for a tab to be selected is a sign that the component
		// has fully initialized.
		expect(
			await screen.findByRole( 'tab', {
				selected: true,
				name: selectedTabName,
			} )
		).toBeVisible();
		// The corresponding tabpanel is also shown.
		expect(
			screen.getByRole( 'tabpanel', {
				name: selectedTabName,
			} )
		).toBeVisible();
	}
}

describe( 'Tabs', () => {
	describe( 'Adherence to spec and basic behavior', () => {
		it( 'should apply the correct roles, semantics and attributes', async () => {
			render(
				<Tabs.Root>
					<Tabs.List>
						<Tabs.Tab value="one">One</Tabs.Tab>
						<Tabs.Tab value="two">Two</Tabs.Tab>
						<Tabs.Tab value="three">Three</Tabs.Tab>
					</Tabs.List>
					<Tabs.Panel value="one">First panel</Tabs.Panel>
					<Tabs.Panel value="two">Second panel</Tabs.Panel>
					<Tabs.Panel value="three">Third panel</Tabs.Panel>
				</Tabs.Root>
			);

			await waitForComponentToBeInitializedWithSelectedTab( 'One' );

			const tabList = screen.getByRole( 'tablist' );
			const allTabs = screen.getAllByRole( 'tab' );
			const allTabpanels = screen.getAllByRole( 'tabpanel' );

			expect( tabList ).toBeVisible();
			// Since 'horizontal' is the default orientation, no need to set it.
			expect( tabList ).not.toHaveAttribute( 'aria-orientation' );

			expect( allTabs ).toHaveLength( TABS.length );

			// Only 1 tab panel is accessible — the one associated with the
			// selected tab. The selected `tab` aria-controls the active
			// `tabpanel`, which is `aria-labelledby` the selected `tab`.
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

		it( 'should associate each `tab` with the correct `tabpanel`, even if they are not rendered in the same order', async () => {
			const TABS_WITH_DELTA_REVERSED = [ ...TABS_WITH_DELTA ].reverse();

			const user = userEvent.setup();

			render(
				<Tabs.Root defaultValue="alpha">
					<Tabs.List>
						{ TABS_WITH_DELTA.map( ( tabObj, index ) => (
							<Tabs.Tab
								key={ `${ tabObj.title }-${ index }` }
								value={ tabObj.value }
								className={ tabObj.tab.className }
								disabled={ tabObj.tab.disabled }
							>
								{ tabObj.title }
							</Tabs.Tab>
						) ) }
					</Tabs.List>
					{ TABS_WITH_DELTA_REVERSED.map( ( tabObj, index ) => (
						<Tabs.Panel
							key={ `${ tabObj.title }-${ index }` }
							value={ tabObj.value }
							// Only apply tabIndex if defined, otherwise fallback
							// to default internal implementation
							{ ...( tabObj.tabpanel?.tabIndex !== undefined && {
								tabIndex: tabObj.tabpanel.tabIndex,
							} ) }
						>
							{ tabObj.content }
						</Tabs.Panel>
					) ) }
				</Tabs.Root>
			);

			await waitForComponentToBeInitializedWithSelectedTab( 'Alpha' );

			// Select Beta, make sure the correct tabpanel is rendered
			await user.click( screen.getByRole( 'tab', { name: 'Beta' } ) );
			expect(
				screen.getByRole( 'tab', {
					selected: true,
					name: 'Beta',
				} )
			).toBeVisible();
			expect(
				screen.getByRole( 'tabpanel', {
					name: 'Beta',
				} )
			).toBeVisible();

			// Select Gamma, make sure the correct tabpanel is rendered
			await user.click( screen.getByRole( 'tab', { name: 'Gamma' } ) );
			expect(
				screen.getByRole( 'tab', {
					selected: true,
					name: 'Gamma',
				} )
			).toBeVisible();
			expect(
				screen.getByRole( 'tabpanel', {
					name: 'Gamma',
				} )
			).toBeVisible();

			// Select Delta, make sure the correct tabpanel is rendered
			await user.click( screen.getByRole( 'tab', { name: 'Delta' } ) );
			expect(
				screen.getByRole( 'tab', {
					selected: true,
					name: 'Delta',
				} )
			).toBeVisible();
			expect(
				screen.getByRole( 'tabpanel', {
					name: 'Delta',
				} )
			).toBeVisible();
		} );

		it( "should apply the tab's `className` to the tab button", async () => {
			render( <UncontrolledTabs tabs={ TABS } /> );

			// Alpha is automatically selected as the selected tab.
			await waitForComponentToBeInitializedWithSelectedTab( 'Alpha' );

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

		it( 'should forward refs', () => {
			const rootRef = createRef< HTMLDivElement >();
			const listRef = createRef< HTMLDivElement >();
			const tabRef = createRef< HTMLButtonElement >();
			const panelRef = createRef< HTMLDivElement >();

			render(
				<Tabs.Root ref={ rootRef } defaultValue="tab1">
					<Tabs.List ref={ listRef }>
						<Tabs.Tab ref={ tabRef } value="tab1">
							Tab 1
						</Tabs.Tab>
						<Tabs.Tab value="tab2">Tab 2</Tabs.Tab>
					</Tabs.List>
					<Tabs.Panel ref={ panelRef } value="tab1">
						Panel 1 content
					</Tabs.Panel>
					<Tabs.Panel value="tab2">Panel 2 content</Tabs.Panel>
				</Tabs.Root>
			);

			expect( rootRef.current ).toBeInstanceOf( HTMLDivElement );
			expect( listRef.current ).toBeInstanceOf( HTMLDivElement );
			expect( tabRef.current ).toBeInstanceOf( HTMLButtonElement );
			expect( panelRef.current ).toBeInstanceOf( HTMLDivElement );
		} );
	} );

	describe( 'pointer interactions', () => {
		it( 'should select a tab when clicked', async () => {
			const mockOnValueChange = jest.fn();

			const user = userEvent.setup();

			render(
				<UncontrolledTabs
					tabs={ TABS }
					onValueChange={ mockOnValueChange }
					defaultValue="alpha"
				/>
			);

			await waitForComponentToBeInitializedWithSelectedTab( 'Alpha' );

			// Click on Beta, make sure beta is the selected tab
			await user.click( screen.getByRole( 'tab', { name: 'Beta' } ) );

			expect(
				screen.getByRole( 'tab', {
					selected: true,
					name: 'Beta',
				} )
			).toBeVisible();
			expect(
				screen.getByRole( 'tabpanel', {
					name: 'Beta',
				} )
			).toBeVisible();

			expect( mockOnValueChange ).toHaveBeenCalledTimes( 1 );
			expect( mockOnValueChange ).toHaveBeenLastCalledWith(
				'beta',
				expect.anything()
			);

			// Click on Alpha, make sure alpha is the selected tab
			await user.click( screen.getByRole( 'tab', { name: 'Alpha' } ) );

			expect(
				screen.getByRole( 'tab', {
					selected: true,
					name: 'Alpha',
				} )
			).toBeVisible();
			expect(
				screen.getByRole( 'tabpanel', {
					name: 'Alpha',
				} )
			).toBeVisible();

			expect( mockOnValueChange ).toHaveBeenCalledTimes( 2 );
			expect( mockOnValueChange ).toHaveBeenLastCalledWith(
				'alpha',
				expect.anything()
			);
		} );

		it( 'should not select a disabled tab when clicked', async () => {
			const mockOnValueChange = jest.fn();

			const user = userEvent.setup();

			render(
				<UncontrolledTabs
					tabs={ TABS_WITH_BETA_DISABLED }
					onValueChange={ mockOnValueChange }
					defaultValue="alpha"
				/>
			);

			// Alpha is automatically selected as the selected tab.
			await waitForComponentToBeInitializedWithSelectedTab( 'Alpha' );

			// Clicking on Beta does not result in beta being selected
			// because the tab is disabled.
			await user.click( screen.getByRole( 'tab', { name: 'Beta' } ) );

			expect(
				screen.getByRole( 'tab', {
					selected: true,
					name: 'Alpha',
				} )
			).toBeVisible();
			expect(
				screen.getByRole( 'tabpanel', {
					name: 'Alpha',
				} )
			).toBeVisible();

			expect( mockOnValueChange ).toHaveBeenCalledTimes( 0 );
		} );
	} );

	describe( 'initial tab selection', () => {
		describe( 'when a selected tab id is not specified', () => {
			describe( 'when left `undefined` [Uncontrolled]', () => {
				it( 'should choose the first tab as selected', async () => {
					const user = userEvent.setup();

					render( <UncontrolledTabs tabs={ TABS } /> );

					// Alpha is automatically selected as the selected tab.
					await waitForComponentToBeInitializedWithSelectedTab(
						'Alpha'
					);

					// Press tab. The selected tab (alpha) received focus.
					await user.keyboard( '{Tab}' );
					expect(
						await screen.findByRole( 'tab', {
							selected: true,
							name: 'Alpha',
						} )
					).toHaveFocus();

					// TODO: check that `onValueChange` fired
					// once https://github.com/mui/base-ui/issues/2097 is fixed
				} );

				it( 'should choose the first non-disabled tab if the first tab is disabled', async () => {
					const user = userEvent.setup();

					render(
						<UncontrolledTabs tabs={ TABS_WITH_ALPHA_DISABLED } />
					);

					// Beta is automatically selected as the selected tab, since alpha is
					// disabled.
					await waitForComponentToBeInitializedWithSelectedTab(
						'Beta'
					);

					// Press tab. The selected tab (beta) received focus. The corresponding
					// tabpanel is shown.
					await user.keyboard( '{Tab}' );
					expect(
						await screen.findByRole( 'tab', {
							selected: true,
							name: 'Beta',
						} )
					).toHaveFocus();

					// TODO: check that `onValueChange` fired
					// once https://github.com/mui/base-ui/issues/2097 is fixed
				} );
			} );
			describe( 'when `null` [Controlled]', () => {
				it( 'should not have a selected tab nor show any tabpanels, make the tablist tabbable and still allow selecting tabs', async () => {
					const user = userEvent.setup();

					render( <ControlledTabs tabs={ TABS } value={ null } /> );

					// No initially selected tabs or tabpanels.
					await waitForComponentToBeInitializedWithSelectedTab(
						undefined
					);

					// Press tab to focus and select the first tab (alpha) and
					// show the related tabpanel.
					await user.keyboard( '{Tab}' );
					await user.keyboard( '{Enter}' );
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
			describe( 'through the `defaultValue` prop [Uncontrolled]', () => {
				it( 'should select the initial tab matching the `defaultValue` prop', async () => {
					const user = userEvent.setup();

					render(
						<UncontrolledTabs tabs={ TABS } defaultValue="beta" />
					);

					// Beta is the initially selected tab
					await waitForComponentToBeInitializedWithSelectedTab(
						'Beta'
					);

					// Press tab. The selected tab (beta) received focus. The corresponding
					// tabpanel is shown.
					await user.keyboard( '{Tab}' );
					expect(
						await screen.findByRole( 'tab', {
							selected: true,
							name: 'Beta',
						} )
					).toHaveFocus();
				} );

				it( 'should select the initial tab matching the `defaultValue` prop even if the tab is disabled', async () => {
					const user = userEvent.setup();
					render(
						<UncontrolledTabs
							tabs={ TABS_WITH_BETA_DISABLED }
							defaultValue="beta"
						/>
					);

					// Beta is automatically selected as the selected tab despite being
					// disabled, respecting the `defaultValue` prop.
					await waitForComponentToBeInitializedWithSelectedTab(
						'Beta'
					);

					// Press tab. The selected tab (beta) received focus, since it is
					// accessible despite being disabled.
					await user.keyboard( '{Tab}' );
					expect(
						await screen.findByRole( 'tab', {
							selected: true,
							name: 'Beta',
						} )
					).toHaveFocus();
				} );

				it( 'should select the first tab and allow tabbing to it when `defaultValue` prop does not match any known tab', async () => {
					const user = userEvent.setup();

					render(
						<UncontrolledTabs
							tabs={ TABS }
							defaultValue="non-existing-tab"
						/>
					);

					// No initially selected tabs or tabpanels, since the `defaultValue`
					// prop is not matching any known tabs.
					await waitForComponentToBeInitializedWithSelectedTab(
						'Alpha'
					);

					// Press tab. The first tab receives focus, but it's
					// not selected.
					await user.keyboard( '{Tab}' );
					expect(
						screen.getByRole( 'tab', { name: 'Alpha' } )
					).toHaveFocus();
					await user.keyboard( '{Enter}' );
					expect(
						screen.queryByRole( 'tab', {
							selected: true,
							name: 'Alpha',
						} )
					).toBeVisible();
					expect(
						await screen.findByRole( 'tabpanel', {
							name: 'Alpha',
						} )
					).toBeVisible();
				} );

				it( 'should select the first non-disabled tab and allow tabbing to it when `defaultValue` prop does not match any known tab', async () => {
					const user = userEvent.setup();
					render(
						<UncontrolledTabs
							tabs={ TABS_WITH_ALPHA_DISABLED }
							defaultValue="non-existing-tab"
						/>
					);

					// No initially selected tabs or tabpanels, since the `defaultValue`
					// prop is not matching any known tabs.
					await waitForComponentToBeInitializedWithSelectedTab(
						'Beta'
					);

					// Press tab. The first non-disabled tab receives focus and is selected.
					await user.keyboard( '{Tab}' );
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

				it( 'should ignore any changes to the `defaultValue` prop after the first render', async () => {
					const mockOnValueChange = jest.fn();
					const consoleErrorSpy = jest
						.spyOn( console, 'error' )
						.mockImplementation( () => {} );

					const { rerender } = render(
						<UncontrolledTabs
							tabs={ TABS }
							defaultValue="beta"
							onValueChange={ mockOnValueChange }
						/>
					);

					// Beta is the initially selected tab
					await waitForComponentToBeInitializedWithSelectedTab(
						'Beta'
					);

					// Changing the defaultValue prop to gamma should not have any effect.
					rerender(
						<UncontrolledTabs
							tabs={ TABS }
							defaultValue="gamma"
							onValueChange={ mockOnValueChange }
						/>
					);

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

					expect( mockOnValueChange ).not.toHaveBeenCalled();

					expect( consoleErrorSpy ).toHaveBeenCalled();
					expect( consoleErrorSpy ).toHaveBeenCalledWith(
						expect.stringContaining(
							'changing the default value state'
						)
					);

					consoleErrorSpy.mockRestore();
				} );
			} );

			describe( 'through the `value` prop [Controlled]', () => {
				describe( 'when the `value` matches an existing tab', () => {
					it( 'should choose the initial tab matching the `value`', async () => {
						const user = userEvent.setup();

						render( <ControlledTabs tabs={ TABS } value="beta" /> );

						// Beta is the initially selected tab
						await waitForComponentToBeInitializedWithSelectedTab(
							'Beta'
						);

						// Press tab. The selected tab (beta) received focus, since it is
						// accessible despite being disabled.
						await user.keyboard( '{Tab}' );
						expect(
							await screen.findByRole( 'tab', {
								selected: true,
								name: 'Beta',
							} )
						).toHaveFocus();
					} );

					it( 'should choose the initial tab matching the `value` even if a `defaultValue` is passed', async () => {
						const user = userEvent.setup();

						render(
							<ControlledTabs
								tabs={ TABS }
								defaultValue="beta"
								value="gamma"
							/>
						);

						// Gamma is the initially selected tab
						await waitForComponentToBeInitializedWithSelectedTab(
							'Gamma'
						);

						// Press tab. The selected tab (gamma) received focus.
						await user.keyboard( '{Tab}' );
						expect(
							await screen.findByRole( 'tab', {
								selected: true,
								name: 'Gamma',
							} )
						).toHaveFocus();
					} );

					it( 'should choose the initial tab matching the `value` even if the tab is disabled', async () => {
						const user = userEvent.setup();

						render(
							<ControlledTabs
								tabs={ TABS_WITH_BETA_DISABLED }
								value="beta"
							/>
						);

						// Beta is the initially selected tab
						await waitForComponentToBeInitializedWithSelectedTab(
							'Beta'
						);

						// Press tab. The selected tab (beta) received focus, since it is
						// accessible despite being disabled.
						await user.keyboard( '{Tab}' );
						expect(
							await screen.findByRole( 'tab', {
								selected: true,
								name: 'Beta',
							} )
						).toHaveFocus();
					} );
				} );

				describe( "when the `value` doesn't match an existing tab", () => {
					it( 'should not have a selected tab nor show any tabpanels, but allow tabbing to the first tab', async () => {
						const user = userEvent.setup();

						render(
							<ControlledTabs
								tabs={ TABS }
								value="non-existing-tab"
							/>
						);

						// No initially selected tabs or tabpanels, since the `value`
						// prop is not matching any known tabs.
						await waitForComponentToBeInitializedWithSelectedTab(
							undefined
						);

						// Press tab. The first tab receives focus and gets selected.
						await user.keyboard( '{Tab}' );
						await user.keyboard( '{Enter}' );
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

					it( 'should not have a selected tab nor show any tabpanels, but allow tabbing to the first tab even when disabled', async () => {
						const user = userEvent.setup();

						render(
							<ControlledTabs
								tabs={ TABS_WITH_ALPHA_DISABLED }
								value="non-existing-tab"
							/>
						);

						// No initially selected tabs or tabpanels, since the `value`
						// prop is not matching any known tabs.
						await waitForComponentToBeInitializedWithSelectedTab(
							undefined
						);

						// Press tab. The first tab receives focus, but it's
						// not selected since it's disabled.
						await user.keyboard( '{Tab}' );
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
						await user.keyboard( '{ArrowRight}' );
						await user.keyboard( '{Enter}' );
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

	describe( 'keyboard interactions', () => {
		describe.each( [
			[ 'Uncontrolled', UncontrolledTabs ],
			[ 'Controlled', ControlledTabs ],
		] )( '[`%s`]', ( _mode, Component ) => {
			it( 'should handle the tablist as one tab stop', async () => {
				const user = userEvent.setup();

				const valueProps =
					_mode === 'Uncontrolled'
						? { defaultValue: 'alpha' }
						: { value: 'alpha' };

				render( <Component tabs={ TABS } { ...valueProps } /> );

				// Alpha is automatically selected as the selected tab.
				await waitForComponentToBeInitializedWithSelectedTab( 'Alpha' );

				// Press tab. The selected tab (alpha) received focus.
				await user.keyboard( '{Tab}' );
				expect(
					await screen.findByRole( 'tab', {
						selected: true,
						name: 'Alpha',
					} )
				).toHaveFocus();

				// By default the tabpanel should receive focus
				await user.keyboard( '{Tab}' );
				expect(
					await screen.findByRole( 'tabpanel', {
						name: 'Alpha',
					} )
				).toHaveFocus();
			} );

			it( 'should not focus the tabpanel container when it is not tabbable', async () => {
				const user = userEvent.setup();

				const valueProps =
					_mode === 'Uncontrolled'
						? { defaultValue: 'alpha' }
						: { value: 'alpha' };

				render(
					<Component
						tabs={ TABS.map( ( tabObj ) =>
							tabObj.value === 'alpha'
								? {
										...tabObj,
										content: (
											<>
												Selected Tab: Alpha
												<button>Alpha Button</button>
											</>
										),
										tabpanel: { tabIndex: -1 },
								  }
								: tabObj
						) }
						{ ...valueProps }
					/>
				);

				// Alpha is automatically selected as the selected tab.
				await waitForComponentToBeInitializedWithSelectedTab( 'Alpha' );

				// Tab should initially focus the first tab in the tablist, which
				// is Alpha.
				await user.keyboard( '{Tab}' );
				expect(
					await screen.findByRole( 'tab', {
						selected: true,
						name: 'Alpha',
					} )
				).toHaveFocus();

				// In this case, the tabpanel container is skipped and focus is
				// moved directly to its contents
				await user.keyboard( '{Tab}' );
				expect(
					await screen.findByRole( 'button', {
						name: 'Alpha Button',
					} )
				).toHaveFocus();
			} );

			it( 'should select tabs in the tablist when using the left and right arrow keys when automatic tab activation is enabled', async () => {
				const mockOnValueChange = jest.fn();
				const user = userEvent.setup();

				const valueProps =
					_mode === 'Uncontrolled'
						? { defaultValue: 'alpha' }
						: { value: 'alpha' };

				render(
					<Component
						tabs={ TABS }
						onValueChange={ mockOnValueChange }
						selectOnMove
						{ ...valueProps }
					/>
				);

				// Alpha is automatically selected as the selected tab.
				await waitForComponentToBeInitializedWithSelectedTab( 'Alpha' );

				// TODO: re-enable once https://github.com/mui/base-ui/issues/2097 is fixed
				// expect( mockOnValueChange ).toHaveBeenCalledTimes( 1 );
				// expect( mockOnValueChange ).toHaveBeenLastCalledWith( 'alpha' );

				// Focus the tablist (and the selected tab, alpha)
				// Tab should initially focus the first tab in the tablist, which
				// is Alpha.
				await user.keyboard( '{Tab}' );
				expect(
					await screen.findByRole( 'tab', {
						selected: true,
						name: 'Alpha',
					} )
				).toHaveFocus();

				// Press the right arrow key to select the beta tab
				await user.keyboard( '{ArrowRight}' );

				expect(
					screen.getByRole( 'tab', {
						selected: true,
						name: 'Beta',
					} )
				).toHaveFocus();
				expect(
					screen.getByRole( 'tabpanel', {
						name: 'Beta',
					} )
				).toBeVisible();

				expect( mockOnValueChange ).toHaveBeenCalledTimes( 1 );
				expect( mockOnValueChange ).toHaveBeenLastCalledWith(
					'beta',
					expect.anything()
				);

				// Press the right arrow key to select the gamma tab
				await user.keyboard( '{ArrowRight}' );

				expect(
					screen.getByRole( 'tab', {
						selected: true,
						name: 'Gamma',
					} )
				).toHaveFocus();
				expect(
					screen.getByRole( 'tabpanel', {
						name: 'Gamma',
					} )
				).toBeVisible();

				expect( mockOnValueChange ).toHaveBeenCalledTimes( 2 );
				expect( mockOnValueChange ).toHaveBeenLastCalledWith(
					'gamma',
					expect.anything()
				);

				// Press the left arrow key to select the beta tab
				await user.keyboard( '{ArrowLeft}' );

				expect(
					screen.getByRole( 'tab', {
						selected: true,
						name: 'Beta',
					} )
				).toHaveFocus();
				expect(
					screen.getByRole( 'tabpanel', {
						name: 'Beta',
					} )
				).toBeVisible();

				expect( mockOnValueChange ).toHaveBeenCalledTimes( 3 );
				expect( mockOnValueChange ).toHaveBeenLastCalledWith(
					'beta',
					expect.anything()
				);
			} );

			it( 'should not automatically select tabs in the tablist when pressing the left and right arrow keys by default (manual tab activation)', async () => {
				const mockOnValueChange = jest.fn();

				const user = userEvent.setup();

				const valueProps =
					_mode === 'Uncontrolled'
						? { defaultValue: 'alpha' }
						: { value: 'alpha' };

				render(
					<Component
						tabs={ TABS }
						onValueChange={ mockOnValueChange }
						{ ...valueProps }
					/>
				);

				// Alpha is automatically selected as the selected tab.
				await waitForComponentToBeInitializedWithSelectedTab( 'Alpha' );

				// TODO: re-enable once https://github.com/mui/base-ui/issues/2097 is fixed
				// expect( mockOnValueChange ).toHaveBeenCalledTimes( 1 );
				// expect( mockOnValueChange ).toHaveBeenLastCalledWith( 'alpha' );

				// Focus the tablist (and the selected tab, alpha)
				// Tab should initially focus the first tab in the tablist, which
				// is Alpha.
				await user.keyboard( '{Tab}' );
				expect(
					await screen.findByRole( 'tab', {
						selected: true,
						name: 'Alpha',
					} )
				).toHaveFocus();

				// Press the right arrow key to move focus to the beta tab,
				// but without selecting it
				await user.keyboard( '{ArrowRight}' );

				expect(
					screen.getByRole( 'tab', {
						selected: false,
						name: 'Beta',
					} )
				).toHaveFocus();
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

				expect( mockOnValueChange ).toHaveBeenCalledTimes( 0 );

				// Press the space key to click the beta tab, and select it.
				// The same should be true with any other mean of clicking the tab button
				// (ie. mouse click, enter key).
				await user.keyboard( '{ }' );

				await waitFor( () =>
					expect(
						screen.getByRole( 'tab', {
							selected: true,
							name: 'Beta',
						} )
					).toHaveFocus()
				);
				expect(
					screen.getByRole( 'tabpanel', {
						name: 'Beta',
					} )
				).toBeVisible();

				expect( mockOnValueChange ).toHaveBeenCalledTimes( 1 );
				expect( mockOnValueChange ).toHaveBeenLastCalledWith(
					'beta',
					expect.anything()
				);
			} );

			it( 'should not select tabs in the tablist when using the up and down arrow keys, unless the `orientation` prop is set to `vertical`', async () => {
				const mockOnValueChange = jest.fn();

				const user = userEvent.setup();

				const valueProps =
					_mode === 'Uncontrolled'
						? { defaultValue: 'alpha' }
						: { value: 'alpha' };

				const { rerender } = render(
					<Component
						tabs={ TABS }
						onValueChange={ mockOnValueChange }
						{ ...valueProps }
					/>
				);

				// Alpha is automatically selected as the selected tab.
				await waitForComponentToBeInitializedWithSelectedTab( 'Alpha' );

				// TODO: re-enable once https://github.com/mui/base-ui/issues/2097 is fixed
				// expect( mockOnValueChange ).toHaveBeenCalledTimes( 1 );
				// expect( mockOnValueChange ).toHaveBeenLastCalledWith( 'alpha' );

				// Focus the tablist (and the selected tab, alpha)
				// Tab should initially focus the first tab in the tablist, which
				// is Alpha.
				await user.keyboard( '{Tab}' );
				expect(
					await screen.findByRole( 'tab', {
						selected: true,
						name: 'Alpha',
					} )
				).toHaveFocus();

				// Press the up arrow key, but the focused/selected tab does not change.
				await user.keyboard( '{ArrowUp}' );

				expect(
					screen.getByRole( 'tab', {
						selected: true,
						name: 'Alpha',
					} )
				).toHaveFocus();
				expect(
					screen.getByRole( 'tabpanel', {
						name: 'Alpha',
					} )
				).toBeVisible();

				expect( mockOnValueChange ).toHaveBeenCalledTimes( 0 );

				// Press the down arrow key, but the focused/selected tab does not change.
				await user.keyboard( '{ArrowDown}' );

				expect(
					screen.getByRole( 'tab', {
						selected: true,
						name: 'Alpha',
					} )
				).toHaveFocus();
				expect(
					screen.getByRole( 'tabpanel', {
						name: 'Alpha',
					} )
				).toBeVisible();

				expect( mockOnValueChange ).toHaveBeenCalledTimes( 0 );

				// Change the orientation to "vertical" and rerender the component.
				rerender(
					<Component
						tabs={ TABS }
						onValueChange={ mockOnValueChange }
						orientation="vertical"
						{ ...valueProps }
					/>
				);

				// Pressing the down arrow key now selects the next tab (beta).
				await user.keyboard( '{ArrowDown}' );
				await user.keyboard( '{Enter}' );

				expect(
					screen.getByRole( 'tab', {
						selected: true,
						name: 'Beta',
					} )
				).toHaveFocus();
				expect(
					screen.getByRole( 'tabpanel', {
						name: 'Beta',
					} )
				).toBeVisible();

				expect( mockOnValueChange ).toHaveBeenCalledTimes( 1 );
				expect( mockOnValueChange ).toHaveBeenLastCalledWith(
					'beta',
					expect.anything()
				);

				// Pressing the up arrow key now selects the previous tab (alpha).
				await user.keyboard( '{ArrowUp}' );
				await user.keyboard( '{Enter}' );

				expect(
					screen.getByRole( 'tab', {
						selected: true,
						name: 'Alpha',
					} )
				).toHaveFocus();
				expect(
					screen.getByRole( 'tabpanel', {
						name: 'Alpha',
					} )
				).toBeVisible();

				expect( mockOnValueChange ).toHaveBeenCalledTimes( 2 );
				expect( mockOnValueChange ).toHaveBeenLastCalledWith(
					'alpha',
					expect.anything()
				);
			} );

			it( 'should loop tab focus at the end of the tablist when using arrow keys', async () => {
				const mockOnValueChange = jest.fn();

				const user = userEvent.setup();

				const valueProps =
					_mode === 'Uncontrolled'
						? { defaultValue: 'alpha' }
						: { value: 'alpha' };

				render(
					<Component
						tabs={ TABS }
						onValueChange={ mockOnValueChange }
						{ ...valueProps }
					/>
				);

				// Alpha is automatically selected as the selected tab.
				await waitForComponentToBeInitializedWithSelectedTab( 'Alpha' );

				// TODO: re-enable once https://github.com/mui/base-ui/issues/2097 is fixed
				// expect( mockOnValueChange ).toHaveBeenCalledTimes( 1 );
				// expect( mockOnValueChange ).toHaveBeenLastCalledWith( 'alpha' );

				// Focus the tablist (and the selected tab, alpha)
				// Tab should initially focus the first tab in the tablist, which
				// is Alpha.
				await user.keyboard( '{Tab}' );
				expect(
					await screen.findByRole( 'tab', {
						selected: true,
						name: 'Alpha',
					} )
				).toHaveFocus();

				// Press the left arrow key to loop around and select the gamma tab
				await user.keyboard( '{ArrowLeft}' );
				await user.keyboard( '{Enter}' );

				expect(
					screen.getByRole( 'tab', {
						selected: true,
						name: 'Gamma',
					} )
				).toHaveFocus();
				expect(
					screen.getByRole( 'tabpanel', {
						name: 'Gamma',
					} )
				).toBeVisible();

				expect( mockOnValueChange ).toHaveBeenCalledTimes( 1 );
				expect( mockOnValueChange ).toHaveBeenLastCalledWith(
					'gamma',
					expect.anything()
				);

				// Press the right arrow key to loop around and select the alpha tab
				await user.keyboard( '{ArrowRight}' );
				await user.keyboard( '{Enter}' );

				expect(
					screen.getByRole( 'tab', {
						selected: true,
						name: 'Alpha',
					} )
				).toHaveFocus();
				expect(
					screen.getByRole( 'tabpanel', {
						name: 'Alpha',
					} )
				).toBeVisible();

				expect( mockOnValueChange ).toHaveBeenCalledTimes( 2 );
				expect( mockOnValueChange ).toHaveBeenLastCalledWith(
					'alpha',
					expect.anything()
				);
			} );

			it( 'should swap the left and right arrow keys when selecting tabs if the writing direction is set to RTL', async () => {
				const mockOnValueChange = jest.fn();

				const user = userEvent.setup();

				const valueProps =
					_mode === 'Uncontrolled'
						? { defaultValue: 'alpha' }
						: { value: 'alpha' };

				render(
					<DirectionProvider direction="rtl">
						<Component
							tabs={ TABS }
							onValueChange={ mockOnValueChange }
							{ ...valueProps }
						/>
					</DirectionProvider>
				);

				// Alpha is automatically selected as the selected tab.
				await waitForComponentToBeInitializedWithSelectedTab( 'Alpha' );

				// TODO: re-enable once https://github.com/mui/base-ui/issues/2097 is fixed
				// expect( mockOnValueChange ).toHaveBeenCalledTimes( 1 );
				// expect( mockOnValueChange ).toHaveBeenLastCalledWith( 'alpha' );

				// Focus the tablist (and the selected tab, alpha)
				// Tab should initially focus the first tab in the tablist, which
				// is Alpha.
				await user.keyboard( '{Tab}' );
				expect(
					await screen.findByRole( 'tab', {
						selected: true,
						name: 'Alpha',
					} )
				).toHaveFocus();

				// Press the left arrow key to select the beta tab
				await user.keyboard( '{ArrowLeft}' );
				await user.keyboard( '{Enter}' );

				expect(
					screen.getByRole( 'tab', {
						selected: true,
						name: 'Beta',
					} )
				).toHaveFocus();
				expect(
					screen.getByRole( 'tabpanel', {
						name: 'Beta',
					} )
				).toBeVisible();

				expect( mockOnValueChange ).toHaveBeenCalledTimes( 1 );
				expect( mockOnValueChange ).toHaveBeenLastCalledWith(
					'beta',
					expect.anything()
				);

				// Press the left arrow key to select the gamma tab
				await user.keyboard( '{ArrowLeft}' );
				await user.keyboard( '{Enter}' );

				expect(
					screen.getByRole( 'tab', {
						selected: true,
						name: 'Gamma',
					} )
				).toHaveFocus();
				expect(
					screen.getByRole( 'tabpanel', {
						name: 'Gamma',
					} )
				).toBeVisible();

				expect( mockOnValueChange ).toHaveBeenCalledTimes( 2 );
				expect( mockOnValueChange ).toHaveBeenLastCalledWith(
					'gamma',
					expect.anything()
				);

				// Press the right arrow key to select the beta tab
				await user.keyboard( '{ArrowRight}' );
				await user.keyboard( '{Enter}' );

				expect(
					screen.getByRole( 'tab', {
						selected: true,
						name: 'Beta',
					} )
				).toHaveFocus();
				expect(
					screen.getByRole( 'tabpanel', {
						name: 'Beta',
					} )
				).toBeVisible();

				expect( mockOnValueChange ).toHaveBeenCalledTimes( 3 );
				expect( mockOnValueChange ).toHaveBeenLastCalledWith(
					'beta',
					expect.anything()
				);
			} );

			it( 'should focus tabs in the tablist even if disabled', async () => {
				const mockOnValueChange = jest.fn();

				const user = userEvent.setup();

				const valueProps =
					_mode === 'Uncontrolled'
						? { defaultValue: 'alpha' }
						: { value: 'alpha' };

				render(
					<Component
						tabs={ TABS_WITH_BETA_DISABLED }
						onValueChange={ mockOnValueChange }
						{ ...valueProps }
					/>
				);

				// Alpha is automatically selected as the selected tab.
				await waitForComponentToBeInitializedWithSelectedTab( 'Alpha' );

				// TODO: re-enable once https://github.com/mui/base-ui/issues/2097 is fixed
				// expect( mockOnValueChange ).toHaveBeenCalledTimes( 1 );
				// expect( mockOnValueChange ).toHaveBeenLastCalledWith( 'alpha' );

				// Focus the tablist (and the selected tab, alpha)
				// Tab should initially focus the first tab in the tablist, which
				// is Alpha.
				await user.keyboard( '{Tab}' );
				expect(
					await screen.findByRole( 'tab', {
						selected: true,
						name: 'Alpha',
					} )
				).toHaveFocus();

				// Pressing the right arrow key moves focus to the beta tab, but alpha
				// remains the selected tab because beta is disabled.
				await user.keyboard( '{ArrowRight}' );
				await user.keyboard( '{Enter}' );

				expect(
					screen.getByRole( 'tab', {
						selected: false,
						name: 'Beta',
					} )
				).toHaveFocus();
				expect(
					screen.getByRole( 'tab', {
						selected: true,
						name: 'Alpha',
					} )
				).toBeVisible();
				expect(
					screen.getByRole( 'tabpanel', {
						name: 'Alpha',
					} )
				).toBeVisible();

				expect( mockOnValueChange ).toHaveBeenCalledTimes( 0 );

				// Press the right arrow key to select the gamma tab
				await user.keyboard( '{ArrowRight}' );
				await user.keyboard( '{Enter}' );

				expect(
					screen.getByRole( 'tab', {
						selected: true,
						name: 'Gamma',
					} )
				).toHaveFocus();
				expect(
					screen.getByRole( 'tabpanel', {
						name: 'Gamma',
					} )
				).toBeVisible();

				expect( mockOnValueChange ).toHaveBeenCalledTimes( 1 );
				expect( mockOnValueChange ).toHaveBeenLastCalledWith(
					'gamma',
					expect.anything()
				);
			} );
		} );

		describe( 'When `selectedId` is changed by the controlling component [Controlled]', () => {
			describe.each( [ true, false ] )(
				'and automatic tab activation is %s',
				( selectOnMove ) => {
					it( 'should continue to handle arrow key navigation properly', async () => {
						const user = userEvent.setup();

						const { rerender } = render(
							<ControlledTabs
								tabs={ TABS }
								value="beta"
								selectOnMove={ selectOnMove }
							/>
						);

						// Beta is the selected tab.
						await waitForComponentToBeInitializedWithSelectedTab(
							'Beta'
						);

						// Tab key should focus the currently first tab (if manual activation mode),
						// or the currently selected tab (if automatic activation mode).
						await user.keyboard( '{Tab}' );
						expect(
							screen.getByRole( 'tab', {
								selected: true,
								name: 'Beta',
							} )
						).toHaveFocus();

						rerender(
							<ControlledTabs
								tabs={ TABS }
								value="gamma"
								selectOnMove={ selectOnMove }
							/>
						);

						expect(
							screen.getByRole( 'tab', {
								selected: true,
								name: 'Gamma',
							} )
						).toBeVisible();
						expect(
							screen.getByRole( 'tab', {
								selected: false,
								name: 'Beta',
							} )
						).toHaveFocus();

						// Arrow left should move focus to the previous tab.
						await user.keyboard( '{ArrowLeft}' );

						await waitFor( () =>
							expect(
								screen.getByRole( 'tab', {
									selected: selectOnMove,
									name: 'Alpha',
								} )
							).toHaveFocus()
						);
					} );

					it( 'should focus the correct tab when tabbing out and back into the tablist', async () => {
						const user = userEvent.setup();

						const { rerender } = render(
							<>
								<button>Focus me</button>
								<ControlledTabs
									tabs={ TABS }
									value="beta"
									selectOnMove={ selectOnMove }
								/>
							</>
						);

						// Beta is the selected tab.
						await waitForComponentToBeInitializedWithSelectedTab(
							'Beta'
						);

						// Tab key should focus the currently selected tab, which is Beta.
						await user.keyboard( '{Tab}' );
						await user.keyboard( '{Tab}' );
						expect(
							screen.getByRole( 'tab', {
								selected: true,
								name: 'Beta',
							} )
						).toHaveFocus();

						// Change the selected tab to gamma via a controlled update.
						rerender(
							<>
								<button>Focus me</button>
								<ControlledTabs
									tabs={ TABS }
									value="gamma"
									selectOnMove={ selectOnMove }
								/>
							</>
						);

						expect(
							screen.getByRole( 'tab', {
								selected: true,
								name: 'Gamma',
							} )
						).toBeVisible();
						expect(
							screen.getByRole( 'tab', {
								selected: false,
								name: 'Beta',
							} )
						).toHaveFocus();

						// Press shift+tab, move focus to the button before Tabs
						await user.keyboard( '{Shift>}{Tab}{/Shift}' );
						expect(
							screen.getByRole( 'button', { name: 'Focus me' } )
						).toHaveFocus();

						// Press tab, move focus back to the tablist
						await user.keyboard( '{Tab}' );

						expect(
							screen.getByRole( 'tab', {
								name: 'Beta',
							} )
						).toHaveFocus();
					} );
				}
			);
		} );
	} );

	describe( 'miscellaneous runtime changes', () => {
		describe( 'removing a tab', () => {
			describe( 'with no explicitly set initial tab', () => {
				it( 'should not select a new tab when the selected tab is removed', async () => {
					const mockOnValueChange = jest.fn();

					const user = userEvent.setup();

					const { rerender } = render(
						<UncontrolledTabs
							tabs={ TABS }
							onValueChange={ mockOnValueChange }
							defaultValue="alpha"
						/>
					);

					// Alpha is automatically selected as the selected tab.
					await waitForComponentToBeInitializedWithSelectedTab(
						'Alpha'
					);

					// TODO: re-enable once https://github.com/mui/base-ui/issues/2097 is fixed
					// expect( mockOnValueChange ).toHaveBeenCalledTimes( 1 );
					// expect( mockOnValueChange ).toHaveBeenLastCalledWith( 'alpha' );

					// Select gamma
					await user.click(
						screen.getByRole( 'tab', { name: 'Gamma' } )
					);

					expect(
						screen.getByRole( 'tab', {
							selected: true,
							name: 'Gamma',
						} )
					).toHaveFocus();
					expect(
						screen.getByRole( 'tabpanel', {
							name: 'Gamma',
						} )
					).toBeVisible();

					expect( mockOnValueChange ).toHaveBeenCalledTimes( 1 );
					expect( mockOnValueChange ).toHaveBeenLastCalledWith(
						'gamma',
						expect.anything()
					);

					// Remove gamma
					rerender(
						<UncontrolledTabs
							tabs={ TABS.slice( 0, 2 ) }
							onValueChange={ mockOnValueChange }
							defaultValue="alpha"
						/>
					);

					expect( screen.getAllByRole( 'tab' ) ).toHaveLength( 2 );

					// Falls back to the first tab.
					expect(
						screen.getByRole( 'tab', {
							name: 'Alpha',
							selected: true,
						} )
					).toBeVisible();
					expect(
						screen.getByRole( 'tabpanel', {
							name: 'Alpha',
						} )
					).toBeVisible();

					expect( mockOnValueChange ).toHaveBeenCalledTimes( 1 );
				} );
			} );

			describe.each( [
				[ 'defaultValue', 'Uncontrolled', UncontrolledTabs ],
				[ 'value', 'Controlled', ControlledTabs ],
			] )(
				'when using the `%s` prop [%s]',
				( propName, mode, Component ) => {
					it( 'should handle the selected tab being removed', async () => {
						const mockOnValueChange = jest.fn();

						const initialComponentProps = {
							tabs: TABS,
							[ propName ]: 'gamma',
							onValueChange: mockOnValueChange,
						};

						const { rerender } = render(
							<Component { ...initialComponentProps } />
						);

						// Gamma is the selected tab.
						await waitForComponentToBeInitializedWithSelectedTab(
							'Gamma'
						);

						// Remove gamma
						rerender(
							<Component
								{ ...initialComponentProps }
								tabs={ TABS.slice( 0, 2 ) }
							/>
						);

						expect( screen.getAllByRole( 'tab' ) ).toHaveLength(
							2
						);

						if ( mode === 'Uncontrolled' ) {
							// Falls back to the first tab.
							expect(
								screen.getByRole( 'tab', {
									name: 'Alpha',
									selected: true,
								} )
							).toBeVisible();
							expect(
								screen.getByRole( 'tabpanel', {
									name: 'Alpha',
								} )
							).toBeVisible();
						}

						if ( mode === 'Controlled' ) {
							// No tab should be selected i.e. it doesn't fall back to first tab.
							expect(
								screen.queryByRole( 'tab', { selected: true } )
							).not.toBeInTheDocument();
							expect(
								screen.queryByRole( 'tabpanel' )
							).not.toBeInTheDocument();
						}

						// Re-add gamma.
						rerender( <Component { ...initialComponentProps } /> );

						expect( screen.getAllByRole( 'tab' ) ).toHaveLength(
							TABS.length
						);

						if ( mode === 'Uncontrolled' ) {
							// First tab stays selected.
							expect(
								screen.getByRole( 'tab', {
									selected: true,
									name: 'Alpha',
								} )
							).toBeVisible();
							expect(
								screen.getByRole( 'tabpanel', {
									name: 'Alpha',
								} )
							).toBeVisible();
						}

						if ( mode === 'Controlled' ) {
							// Gamma becomes selected again.
							expect(
								screen.getByRole( 'tab', {
									selected: true,
									name: 'Gamma',
								} )
							).toBeVisible();
							expect(
								screen.getByRole( 'tabpanel', {
									name: 'Gamma',
								} )
							).toBeVisible();
						}

						expect( mockOnValueChange ).not.toHaveBeenCalled();
					} );

					it( `should not fall back to the tab matching the \`${ propName }\` prop when a different selected tab is removed`, async () => {
						const mockOnValueChange = jest.fn();

						const initialComponentProps = {
							tabs: TABS,
							[ propName ]: 'gamma',
							onValueChange: mockOnValueChange,
						};

						const user = userEvent.setup();

						const { rerender } = render(
							<Component { ...initialComponentProps } />
						);

						// Gamma is the selected tab.
						await waitForComponentToBeInitializedWithSelectedTab(
							'Gamma'
						);

						// Select alpha
						await user.click(
							screen.getByRole( 'tab', { name: 'Alpha' } )
						);

						expect(
							screen.getByRole( 'tab', {
								selected: true,
								name: 'Alpha',
							} )
						).toHaveFocus();
						expect(
							screen.getByRole( 'tabpanel', {
								name: 'Alpha',
							} )
						).toBeVisible();

						expect( mockOnValueChange ).toHaveBeenCalledTimes( 1 );
						expect( mockOnValueChange ).toHaveBeenLastCalledWith(
							'alpha',
							expect.anything()
						);

						// Remove alpha
						rerender(
							<Component
								{ ...initialComponentProps }
								tabs={ TABS.slice( 1 ) }
							/>
						);

						expect( screen.getAllByRole( 'tab' ) ).toHaveLength(
							2
						);

						if ( mode === 'Uncontrolled' ) {
							// Falls back to the first available tab.
							expect(
								screen.getByRole( 'tab', {
									name: 'Beta',
									selected: true,
								} )
							).toBeVisible();
							expect(
								screen.getByRole( 'tabpanel', {
									name: 'Beta',
								} )
							).toBeVisible();
						}

						if ( mode === 'Controlled' ) {
							// No tab should be selected i.e. it doesn't fall back to gamma,
							// even if it matches the `defaultValue` prop.
							expect(
								screen.queryByRole( 'tab', { selected: true } )
							).not.toBeInTheDocument();
							// No tabpanel should be rendered either
							expect(
								screen.queryByRole( 'tabpanel' )
							).not.toBeInTheDocument();
						}

						// Re-add alpha. Alpha becomes selected again.
						rerender( <Component { ...initialComponentProps } /> );

						expect( screen.getAllByRole( 'tab' ) ).toHaveLength(
							TABS.length
						);

						if ( mode === 'Uncontrolled' ) {
							// Beta stays selected.
							expect(
								screen.getByRole( 'tab', {
									selected: true,
									name: 'Beta',
								} )
							).toBeVisible();
							expect(
								screen.getByRole( 'tabpanel', {
									name: 'Beta',
								} )
							).toBeVisible();
						}

						if ( mode === 'Controlled' ) {
							expect(
								screen.getByRole( 'tab', {
									selected: true,
									name: 'Alpha',
								} )
							).toBeVisible();
							expect(
								screen.getByRole( 'tabpanel', {
									name: 'Alpha',
								} )
							).toBeVisible();
						}

						expect( mockOnValueChange ).toHaveBeenCalledTimes( 1 );
					} );
				}
			);
		} );

		describe( 'adding a tab', () => {
			describe.each( [
				[ 'defaultValue', 'Uncontrolled', UncontrolledTabs ],
				[ 'value', 'Controlled', ControlledTabs ],
			] )(
				'when using the `%s` prop [%s]',
				( propName, mode, Component ) => {
					it( `should select a newly added tab if it matches the \`${ propName }\` prop`, async () => {
						const mockOnValueChange = jest.fn();

						const initialComponentProps = {
							tabs: TABS,
							[ propName ]: 'delta',
							onValueChange: mockOnValueChange,
						};

						const { rerender } = render(
							<Component { ...initialComponentProps } />
						);

						if ( mode === 'Uncontrolled' ) {
							// Falls back to the first tab.
							await waitForComponentToBeInitializedWithSelectedTab(
								'Alpha'
							);
						}

						if ( mode === 'Controlled' ) {
							// No initially selected tabs or tabpanels, since the `value`
							// prop is not matching any known tabs.
							await waitForComponentToBeInitializedWithSelectedTab(
								undefined
							);
						}

						expect( mockOnValueChange ).not.toHaveBeenCalled();

						// Re-render with delta added.
						rerender(
							<Component
								{ ...initialComponentProps }
								tabs={ TABS_WITH_DELTA }
							/>
						);

						if ( mode === 'Uncontrolled' ) {
							// Alpha stays selected.
							expect(
								screen.getByRole( 'tab', {
									selected: true,
									name: 'Alpha',
								} )
							).toBeVisible();
							expect(
								screen.getByRole( 'tabpanel', {
									name: 'Alpha',
								} )
							).toBeVisible();
						}

						if ( mode === 'Controlled' ) {
							// Delta becomes selected
							expect(
								screen.getByRole( 'tab', {
									selected: true,
									name: 'Delta',
								} )
							).toBeVisible();
							expect(
								screen.getByRole( 'tabpanel', {
									name: 'Delta',
								} )
							).toBeVisible();
						}

						expect( mockOnValueChange ).not.toHaveBeenCalled();
					} );
				}
			);
		} );
		describe( 'a tab becomes disabled', () => {
			describe.each( [
				[ 'defaultValue', 'Uncontrolled', UncontrolledTabs ],
				[ 'value', 'Controlled', ControlledTabs ],
			] )(
				'when using the `%s` prop [%s]',
				( propName, mode, Component ) => {
					it( `should keep the initial tab matching the \`${ propName }\` prop as selected even if it becomes disabled`, async () => {
						const mockOnValueChange = jest.fn();

						const initialComponentProps = {
							tabs: TABS,
							[ propName ]: 'beta',
							onValueChange: mockOnValueChange,
						};

						const { rerender } = render(
							<Component { ...initialComponentProps } />
						);

						// Beta is the selected tab.
						await waitForComponentToBeInitializedWithSelectedTab(
							'Beta'
						);

						expect( mockOnValueChange ).not.toHaveBeenCalled();

						// Re-render with beta disabled.
						rerender(
							<Component
								{ ...initialComponentProps }
								tabs={ TABS_WITH_BETA_DISABLED }
							/>
						);

						// Beta continues to be selected and focused, even if it is disabled.
						expect(
							screen.getByRole( 'tab', {
								selected: true,
								name: 'Beta',
							} )
						).toBeVisible();
						expect(
							screen.getByRole( 'tabpanel', {
								name: 'Beta',
							} )
						).toBeVisible();

						// Re-enable beta.
						rerender( <Component { ...initialComponentProps } /> );

						// Beta continues to be selected and focused.
						expect(
							screen.getByRole( 'tab', {
								selected: true,
								name: 'Beta',
							} )
						).toBeVisible();
						expect(
							screen.getByRole( 'tabpanel', {
								name: 'Beta',
							} )
						).toBeVisible();

						expect( mockOnValueChange ).not.toHaveBeenCalled();
					} );

					it( 'should handle the user-selected tab becoming disabled', async () => {
						const mockOnValueChange = jest.fn();

						const user = userEvent.setup();

						const initialComponentProps = {
							tabs: TABS,
							[ propName ]: 'alpha',
							onValueChange: mockOnValueChange,
						};

						const { rerender } = render(
							<Component { ...initialComponentProps } />
						);

						// Alpha is automatically selected as the selected tab.
						await waitForComponentToBeInitializedWithSelectedTab(
							'Alpha'
						);

						// TODO: re-enable once https://github.com/mui/base-ui/issues/2097 is fixed
						// expect( mockOnValueChange ).toHaveBeenCalledTimes( 1 );
						// expect( mockOnValueChange ).toHaveBeenLastCalledWith( 'alpha' );

						// Click on beta tab, beta becomes selected.
						await user.click(
							screen.getByRole( 'tab', { name: 'Beta' } )
						);

						expect(
							screen.getByRole( 'tab', {
								selected: true,
								name: 'Beta',
							} )
						).toBeVisible();
						expect(
							screen.getByRole( 'tabpanel', {
								name: 'Beta',
							} )
						).toBeVisible();

						expect( mockOnValueChange ).toHaveBeenCalledTimes( 1 );
						expect( mockOnValueChange ).toHaveBeenLastCalledWith(
							'beta',
							expect.anything()
						);

						// Re-render with beta disabled.
						rerender(
							<Component
								{ ...initialComponentProps }
								tabs={ TABS_WITH_BETA_DISABLED }
							/>
						);

						if ( mode === 'Uncontrolled' ) {
							// Alpha becomes the selected tab.
							expect(
								screen.getByRole( 'tab', {
									selected: true,
									name: 'Alpha',
								} )
							).toBeVisible();
							expect(
								screen.getByRole( 'tabpanel', {
									name: 'Alpha',
								} )
							).toBeVisible();
						}

						if ( mode === 'Controlled' ) {
							// Beta continues to be selected, even if it is disabled.
							expect(
								screen.getByRole( 'tab', {
									selected: true,
									name: 'Beta',
								} )
							).toHaveFocus();
							expect(
								screen.getByRole( 'tabpanel', {
									name: 'Beta',
								} )
							).toBeVisible();
						}

						// Re-enable beta.
						rerender( <Component { ...initialComponentProps } /> );

						if ( mode === 'Uncontrolled' ) {
							// Alpha stays selected.
							expect(
								screen.getByRole( 'tab', {
									selected: true,
									name: 'Alpha',
								} )
							).toBeVisible();
							expect(
								screen.getByRole( 'tabpanel', {
									name: 'Alpha',
								} )
							).toBeVisible();
						}

						if ( mode === 'Controlled' ) {
							// Beta continues to be selected and focused.
							expect(
								screen.getByRole( 'tab', {
									selected: true,
									name: 'Beta',
								} )
							).toBeVisible();
							expect(
								screen.getByRole( 'tabpanel', {
									name: 'Beta',
								} )
							).toBeVisible();
						}

						expect( mockOnValueChange ).toHaveBeenCalledTimes( 1 );
					} );
				}
			);
		} );
	} );
} );
/* eslint-enable jest/no-conditional-expect */
