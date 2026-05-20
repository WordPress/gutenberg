/**
 * External dependencies
 */
import type { StoryObj, Meta } from '@storybook/react-vite';
import { css } from '@emotion/react';
import { fn, expect, userEvent, within, screen, waitFor } from 'storybook/test';

/**
 * WordPress dependencies
 */
import { customLink, formatCapitalize } from '@wordpress/icons';
import {
	useState,
	useMemo,
	useContext,
	useRef,
	useEffect,
	render,
	unmountComponentAtNode,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useCx } from '../../utils';
import { Menu } from '..';
import Icon from '../../icon';
import Button from '../../button';
import Modal from '../../modal';
import { createSlotFill, Provider as SlotFillProvider } from '../../slot-fill';
import { ContextSystemProvider } from '../../context';
import type { Props } from '../types';

const meta: Meta< typeof Menu > = {
	id: 'components-menu',
	title: 'Components/Actions/Menu',
	component: Menu,
	subcomponents: {
		Item: Menu.Item,
		CheckboxItem: Menu.CheckboxItem,
		Group: Menu.Group,
		GroupLabel: Menu.GroupLabel,
		Separator: Menu.Separator,
		// @ts-expect-error - See https://github.com/storybookjs/storybook/issues/23170
		Context: Menu.Context,
		RadioItem: Menu.RadioItem,
		ItemLabel: Menu.ItemLabel,
		ItemHelpText: Menu.ItemHelpText,
		TriggerButton: Menu.TriggerButton,
		SubmenuTriggerItem: Menu.SubmenuTriggerItem,
		Popover: Menu.Popover,
	},
	args: {
		onOpenChange: fn(),
	},
	argTypes: {
		children: { control: false },
	},
	tags: [ 'status-private' ],
	parameters: {
		controls: { expanded: true },
		docs: {
			canvas: { sourceState: 'shown' },
			source: { excludeDecorators: true },
		},
		componentStatus: {
			status: 'recommended',
			whereUsed: 'global',
			notes: 'When building for the Gutenberg repo, use this component instead of `DropdownMenu`. Otherwise, continue using `DropdownMenu` for now.',
		},
	},
};
export default meta;

export const Default: StoryObj< typeof Menu > = {
	args: {
		children: (
			<>
				<Menu.TriggerButton
					render={
						<Button __next40pxDefaultSize variant="secondary" />
					}
				>
					Open menu
				</Menu.TriggerButton>
				<Menu.Popover>
					<Menu.Item>
						<Menu.ItemLabel>Label</Menu.ItemLabel>
					</Menu.Item>
					<Menu.Item>
						<Menu.ItemLabel>Label</Menu.ItemLabel>
						<Menu.ItemHelpText>Help text</Menu.ItemHelpText>
					</Menu.Item>
					<Menu.Item>
						<Menu.ItemLabel>Label</Menu.ItemLabel>
						<Menu.ItemHelpText>
							The menu item help text is automatically truncated
							when there are more than two lines of text
						</Menu.ItemHelpText>
					</Menu.Item>
					<Menu.Item hideOnClick={ false }>
						<Menu.ItemLabel>Label</Menu.ItemLabel>
						<Menu.ItemHelpText>
							This item doesn&apos;t close the menu on click
						</Menu.ItemHelpText>
					</Menu.Item>
					<Menu.Item disabled>Disabled item</Menu.Item>
					<Menu.Separator />
					<Menu.Group>
						<Menu.GroupLabel>Group label</Menu.GroupLabel>
						<Menu.Item
							prefix={ <Icon icon={ customLink } size={ 24 } /> }
						>
							<Menu.ItemLabel>With prefix</Menu.ItemLabel>
						</Menu.Item>
						<Menu.Item suffix="⌘S">With suffix</Menu.Item>
						<Menu.Item
							disabled
							prefix={
								<Icon icon={ formatCapitalize } size={ 24 } />
							}
							suffix="⌥⌘T"
						>
							<Menu.ItemLabel>
								Disabled with prefix and suffix
							</Menu.ItemLabel>
							<Menu.ItemHelpText>And help text</Menu.ItemHelpText>
						</Menu.Item>
					</Menu.Group>
				</Menu.Popover>
			</>
		),
	},
};

export const WithSubmenu: StoryObj< typeof Menu > = {
	args: {
		...Default.args,
		children: (
			<>
				<Menu.TriggerButton
					render={
						<Button __next40pxDefaultSize variant="secondary" />
					}
				>
					Open menu
				</Menu.TriggerButton>
				<Menu.Popover>
					<Menu.Item>Level 1 item</Menu.Item>
					<Menu>
						<Menu.SubmenuTriggerItem suffix="Suffix">
							<Menu.ItemLabel>
								Submenu trigger item with a long label
							</Menu.ItemLabel>
						</Menu.SubmenuTriggerItem>
						<Menu.Popover>
							<Menu.Item>
								<Menu.ItemLabel>Level 2 item</Menu.ItemLabel>
							</Menu.Item>
							<Menu.Item>
								<Menu.ItemLabel>Level 2 item</Menu.ItemLabel>
							</Menu.Item>
							<Menu>
								<Menu.SubmenuTriggerItem>
									<Menu.ItemLabel>
										Submenu trigger
									</Menu.ItemLabel>
								</Menu.SubmenuTriggerItem>
								<Menu.Popover>
									<Menu.Item>
										<Menu.ItemLabel>
											Level 3 item
										</Menu.ItemLabel>
									</Menu.Item>
									<Menu.Item>
										<Menu.ItemLabel>
											Level 3 item
										</Menu.ItemLabel>
									</Menu.Item>
								</Menu.Popover>
							</Menu>
						</Menu.Popover>
					</Menu>
				</Menu.Popover>
			</>
		),
	},
};

export const WithCheckboxes: StoryObj< typeof Menu > = {
	render: function WithCheckboxes( props: Props ) {
		const [ isAChecked, setAChecked ] = useState( false );
		const [ isBChecked, setBChecked ] = useState( true );
		const [ multipleCheckboxesValue, setMultipleCheckboxesValue ] =
			useState< string[] >( [ 'b' ] );

		const onMultipleCheckboxesCheckedChange: React.ComponentProps<
			typeof Menu.CheckboxItem
		>[ 'onChange' ] = ( e ) => {
			setMultipleCheckboxesValue( ( prevValues ) => {
				if ( prevValues.includes( e.target.value ) ) {
					return prevValues.filter(
						( val ) => val !== e.target.value
					);
				}
				return [ ...prevValues, e.target.value ];
			} );
		};

		return (
			<Menu { ...props }>
				<Menu.TriggerButton
					render={
						<Button __next40pxDefaultSize variant="secondary" />
					}
				>
					Open menu
				</Menu.TriggerButton>
				<Menu.Popover>
					<Menu.Group>
						<Menu.GroupLabel>
							Single selection, uncontrolled
						</Menu.GroupLabel>
						<Menu.CheckboxItem
							name="checkbox-individual-uncontrolled-a"
							value="a"
							suffix="⌥⌘T"
						>
							<Menu.ItemLabel>Checkbox item A</Menu.ItemLabel>
							<Menu.ItemHelpText>
								Initially unchecked
							</Menu.ItemHelpText>
						</Menu.CheckboxItem>
						<Menu.CheckboxItem
							name="checkbox-individual-uncontrolled-b"
							value="b"
							defaultChecked
						>
							<Menu.ItemLabel>Checkbox item B</Menu.ItemLabel>
							<Menu.ItemHelpText>
								Initially checked
							</Menu.ItemHelpText>
						</Menu.CheckboxItem>
					</Menu.Group>
					<Menu.Separator />
					<Menu.Group>
						<Menu.GroupLabel>
							Single selection, controlled
						</Menu.GroupLabel>
						<Menu.CheckboxItem
							name="checkbox-individual-controlled-a"
							value="a"
							checked={ isAChecked }
							onChange={ ( e ) => {
								setAChecked( e.target.checked );
							} }
						>
							<Menu.ItemLabel>Checkbox item A</Menu.ItemLabel>
							<Menu.ItemHelpText>
								Initially unchecked
							</Menu.ItemHelpText>
						</Menu.CheckboxItem>
						<Menu.CheckboxItem
							name="checkbox-individual-controlled-b"
							value="b"
							checked={ isBChecked }
							onChange={ ( e ) =>
								setBChecked( e.target.checked )
							}
						>
							<Menu.ItemLabel>Checkbox item B</Menu.ItemLabel>
							<Menu.ItemHelpText>
								Initially checked
							</Menu.ItemHelpText>
						</Menu.CheckboxItem>
					</Menu.Group>
					<Menu.Separator />
					<Menu.Group>
						<Menu.GroupLabel>
							Multiple selection, uncontrolled
						</Menu.GroupLabel>
						<Menu.CheckboxItem
							name="checkbox-multiple-uncontrolled"
							value="a"
						>
							<Menu.ItemLabel>Checkbox item A</Menu.ItemLabel>
							<Menu.ItemHelpText>
								Initially unchecked
							</Menu.ItemHelpText>
						</Menu.CheckboxItem>
						<Menu.CheckboxItem
							name="checkbox-multiple-uncontrolled"
							value="b"
							defaultChecked
						>
							<Menu.ItemLabel>Checkbox item B</Menu.ItemLabel>
							<Menu.ItemHelpText>
								Initially checked
							</Menu.ItemHelpText>
						</Menu.CheckboxItem>
					</Menu.Group>
					<Menu.Separator />
					<Menu.Group>
						<Menu.GroupLabel>
							Multiple selection, controlled
						</Menu.GroupLabel>
						<Menu.CheckboxItem
							name="checkbox-multiple-controlled"
							value="a"
							checked={ multipleCheckboxesValue.includes( 'a' ) }
							onChange={ onMultipleCheckboxesCheckedChange }
						>
							<Menu.ItemLabel>Checkbox item A</Menu.ItemLabel>
							<Menu.ItemHelpText>
								Initially unchecked
							</Menu.ItemHelpText>
						</Menu.CheckboxItem>
						<Menu.CheckboxItem
							name="checkbox-multiple-controlled"
							value="b"
							checked={ multipleCheckboxesValue.includes( 'b' ) }
							onChange={ onMultipleCheckboxesCheckedChange }
						>
							<Menu.ItemLabel>Checkbox item B</Menu.ItemLabel>
							<Menu.ItemHelpText>
								Initially checked
							</Menu.ItemHelpText>
						</Menu.CheckboxItem>
					</Menu.Group>
				</Menu.Popover>
			</Menu>
		);
	},

	args: {
		...Default.args,
	},
};

export const WithRadios: StoryObj< typeof Menu > = {
	render: function WithRadios( props: Props ) {
		const [ radioValue, setRadioValue ] = useState( 'two' );
		const onRadioChange: React.ComponentProps<
			typeof Menu.RadioItem
		>[ 'onChange' ] = ( e ) => setRadioValue( e.target.value );

		return (
			<Menu { ...props }>
				<Menu.TriggerButton
					render={
						<Button __next40pxDefaultSize variant="secondary" />
					}
				>
					Open menu
				</Menu.TriggerButton>
				<Menu.Popover>
					<Menu.Group>
						<Menu.GroupLabel>Uncontrolled</Menu.GroupLabel>
						<Menu.RadioItem name="radio-uncontrolled" value="one">
							<Menu.ItemLabel>Radio item 1</Menu.ItemLabel>
							<Menu.ItemHelpText>
								Initially unchecked
							</Menu.ItemHelpText>
						</Menu.RadioItem>
						<Menu.RadioItem
							name="radio-uncontrolled"
							value="two"
							defaultChecked
						>
							<Menu.ItemLabel>Radio item 2</Menu.ItemLabel>
							<Menu.ItemHelpText>
								Initially checked
							</Menu.ItemHelpText>
						</Menu.RadioItem>
					</Menu.Group>
					<Menu.Separator />
					<Menu.Group>
						<Menu.GroupLabel>Controlled</Menu.GroupLabel>
						<Menu.RadioItem
							name="radio-controlled"
							value="one"
							checked={ radioValue === 'one' }
							onChange={ onRadioChange }
						>
							<Menu.ItemLabel>Radio item 1</Menu.ItemLabel>
							<Menu.ItemHelpText>
								Initially unchecked
							</Menu.ItemHelpText>
						</Menu.RadioItem>
						<Menu.RadioItem
							name="radio-controlled"
							value="two"
							checked={ radioValue === 'two' }
							onChange={ onRadioChange }
						>
							<Menu.ItemLabel>Radio item 2</Menu.ItemLabel>
							<Menu.ItemHelpText>
								Initially checked
							</Menu.ItemHelpText>
						</Menu.RadioItem>
					</Menu.Group>
				</Menu.Popover>
			</Menu>
		);
	},

	args: {
		...Default.args,
	},
};

const modalOnTopOfMenuPopover = css`
	&& {
		z-index: 1000000;
	}
`;

export const WithModals: StoryObj< typeof Menu > = {
	render: function WithModals( props: Props ) {
		const [ isOuterModalOpen, setOuterModalOpen ] = useState( false );
		const [ isInnerModalOpen, setInnerModalOpen ] = useState( false );

		const cx = useCx();
		const modalOverlayClassName = cx( modalOnTopOfMenuPopover );

		return (
			<>
				<Menu { ...props }>
					<Menu.TriggerButton
						render={
							<Button __next40pxDefaultSize variant="secondary" />
						}
					>
						Open menu
					</Menu.TriggerButton>
					<Menu.Popover>
						<Menu.Item
							onClick={ () => setOuterModalOpen( true ) }
							hideOnClick={ false }
						>
							<Menu.ItemLabel>Open outer modal</Menu.ItemLabel>
						</Menu.Item>
						<Menu.Item
							onClick={ () => setInnerModalOpen( true ) }
							hideOnClick={ false }
						>
							<Menu.ItemLabel>Open inner modal</Menu.ItemLabel>
						</Menu.Item>
						{ isInnerModalOpen && (
							<Modal
								onRequestClose={ () =>
									setInnerModalOpen( false )
								}
								overlayClassName={ modalOverlayClassName }
							>
								Modal&apos;s contents
								<button
									onClick={ () => setInnerModalOpen( false ) }
								>
									Close
								</button>
							</Modal>
						) }
					</Menu.Popover>
				</Menu>
				{ isOuterModalOpen && (
					<Modal
						onRequestClose={ () => setOuterModalOpen( false ) }
						overlayClassName={ modalOverlayClassName }
					>
						Modal&apos;s contents
						<button onClick={ () => setOuterModalOpen( false ) }>
							Close
						</button>
					</Modal>
				) }
			</>
		);
	},

	args: {
		...Default.args,
	},
};

const ExampleSlotFill = createSlotFill( 'Example' );

const Slot = () => {
	const menuContext = useContext( Menu.Context );

	// Forwarding the content of the slot so that it can be used by the fill
	const fillProps = useMemo(
		() => ( {
			forwardedContext: [
				[ Menu.Context.Provider, { value: menuContext } ],
			],
		} ),
		[ menuContext ]
	);

	return (
		<ExampleSlotFill.Slot
			fillProps={ fillProps }
			bubblesVirtually
			style={ { display: 'contents' } }
		/>
	);
};

type ForwardedContextTuple< P = {} > = [
	React.ComponentType< React.PropsWithChildren< P > >,
	P,
];

const Fill = ( { children }: { children: React.ReactNode } ) => {
	const innerMarkup = <>{ children }</>;

	return (
		<ExampleSlotFill.Fill>
			{ ( fillProps: { forwardedContext?: ForwardedContextTuple[] } ) => {
				const { forwardedContext = [] } = fillProps;

				return forwardedContext.reduce(
					( inner: React.JSX.Element, [ Provider, props ] ) => (
						<Provider { ...props }>{ inner }</Provider>
					),
					innerMarkup
				);
			} }
		</ExampleSlotFill.Fill>
	);
};

export const WithSlotFill: StoryObj< typeof Menu > = {
	render: ( props: Props ) => {
		return (
			<SlotFillProvider>
				<Menu { ...props }>
					<Menu.TriggerButton
						render={
							<Button __next40pxDefaultSize variant="secondary" />
						}
					>
						Open menu
					</Menu.TriggerButton>
					<Menu.Popover>
						<Menu.Item>
							<Menu.ItemLabel>Item</Menu.ItemLabel>
						</Menu.Item>
						<Slot />
					</Menu.Popover>
				</Menu>

				<Fill>
					<Menu.Item>
						<Menu.ItemLabel>Item from fill</Menu.ItemLabel>
					</Menu.Item>
					<Menu>
						<Menu.SubmenuTriggerItem>
							<Menu.ItemLabel>Submenu from fill</Menu.ItemLabel>
						</Menu.SubmenuTriggerItem>
						<Menu.Popover>
							<Menu.Item>
								<Menu.ItemLabel>
									Submenu item from fill
								</Menu.ItemLabel>
							</Menu.Item>
						</Menu.Popover>
					</Menu>
				</Fill>
			</SlotFillProvider>
		);
	},

	args: {
		...Default.args,
	},
};

const toolbarVariantContextValue = {
	Menu: {
		variant: 'toolbar',
	},
};

export const ToolbarVariant: StoryObj< typeof Menu > = {
	render: ( props: Props ) => (
		// TODO: add toolbar
		<ContextSystemProvider value={ toolbarVariantContextValue }>
			<Menu { ...props }>
				<Menu.TriggerButton
					render={
						<Button __next40pxDefaultSize variant="secondary" />
					}
				>
					Open menu
				</Menu.TriggerButton>
				<Menu.Popover>
					<Menu.Item>
						<Menu.ItemLabel>Level 1 item</Menu.ItemLabel>
					</Menu.Item>
					<Menu.Item>
						<Menu.ItemLabel>Level 1 item</Menu.ItemLabel>
					</Menu.Item>
					<Menu.Separator />
					<Menu>
						<Menu.SubmenuTriggerItem>
							<Menu.ItemLabel>Submenu trigger</Menu.ItemLabel>
						</Menu.SubmenuTriggerItem>
						<Menu.Popover>
							<Menu.Item>
								<Menu.ItemLabel>Level 2 item</Menu.ItemLabel>
							</Menu.Item>
						</Menu.Popover>
					</Menu>
				</Menu.Popover>
			</Menu>
		</ContextSystemProvider>
	),

	args: {
		...Default.args,
	},
};

export const InsideModal: StoryObj< typeof Menu > = {
	render: function InsideModal( props: Props ) {
		const [ isModalOpen, setModalOpen ] = useState( false );
		return (
			<>
				<Button
					onClick={ () => setModalOpen( true ) }
					__next40pxDefaultSize
					variant="secondary"
				>
					Open modal
				</Button>
				{ isModalOpen && (
					<Modal
						onRequestClose={ () => setModalOpen( false ) }
						title="Menu inside modal"
					>
						<Menu { ...props }>
							<Menu.TriggerButton
								render={
									<Button
										__next40pxDefaultSize
										variant="secondary"
									/>
								}
							>
								Open menu
							</Menu.TriggerButton>
							<Menu.Popover>
								<Menu.Item>
									<Menu.ItemLabel>
										Level 1 item
									</Menu.ItemLabel>
								</Menu.Item>
								<Menu.Item>
									<Menu.ItemLabel>
										Level 1 item
									</Menu.ItemLabel>
								</Menu.Item>
								<Menu.Separator />
								<Menu>
									<Menu.SubmenuTriggerItem>
										<Menu.ItemLabel>
											Submenu trigger
										</Menu.ItemLabel>
									</Menu.SubmenuTriggerItem>
									<Menu.Popover>
										<Menu.Item>
											<Menu.ItemLabel>
												Level 2 item
											</Menu.ItemLabel>
										</Menu.Item>
									</Menu.Popover>
								</Menu>
							</Menu.Popover>
						</Menu>
						<Button
							__next40pxDefaultSize
							onClick={ () => setModalOpen( false ) }
						>
							Close modal
						</Button>
					</Modal>
				) }
			</>
		);
	},

	args: {
		...Default.args,
	},

	parameters: {
		docs: {
			source: { type: 'code' },
		},
	},
};

/**
 * Runs `callback` with the React 18 `ReactDOM.render` / `unmountComponentAtNode`
 * deprecation warnings filtered out — they are expected here, since the legacy
 * API is used intentionally (see `LegacyRoot`).
 */
/* eslint-disable no-console -- Intentionally filters known legacy-API warnings. */
function withoutLegacyReactWarnings( callback: () => void ) {
	const original = console.error;
	console.error = ( ...args: unknown[] ) => {
		if (
			typeof args[ 0 ] === 'string' &&
			/ReactDOM\.render|unmountComponentAtNode/.test( args[ 0 ] )
		) {
			return;
		}
		original( ...args );
	};
	try {
		callback();
	} finally {
		console.error = original;
	}
}
/* eslint-enable no-console */

/**
 * Mounts its children into a legacy `ReactDOM.render` root.
 *
 * The popover bug below only reproduces under React 17 update timing, which
 * does not batch state updates triggered outside React event handlers (e.g.
 * inside `requestAnimationFrame` callbacks). React 18's automatic batching
 * masks the bug, so reproducing it deterministically requires a legacy root
 * that restores React 17 timing.
 */
function LegacyRoot( { children }: { children: React.ReactElement } ) {
	const ref = useRef< HTMLDivElement >( null );

	useEffect( () => {
		const node = ref.current;
		if ( ! node ) {
			return;
		}
		withoutLegacyReactWarnings( () => render( children, node ) );
		return () => {
			withoutLegacyReactWarnings( () => unmountComponentAtNode( node ) );
		};
	}, [ children ] );

	return <div ref={ ref } />;
}

/**
 * Regression test for `Menu.Popover` rendering stuck at `opacity: 0`.
 *
 * `Menu.Popover` puts Ariakit's props (ref, `data-enter`) on the inner
 * `MenuSurface` while the opacity/transform motion lives on the
 * `MenuMotionRoot` wrapper — so the surface has no transition of its own and
 * reports `transitionDuration: 0s`. Ariakit's `useDisclosureContent` reads
 * that `0s` and calls `store.setState( "animated", false )`. A modal menu
 * shares one Ariakit store between its dialog backdrop and this surface, so
 * that flag flip can starve the surface's own enter transition: `data-enter`
 * is never stamped, the `MenuMotionRoot` `:has( … [data-enter] )` rule never
 * matches, and the popover renders fully invisible while still in the DOM and
 * keyboard-reachable.
 *
 * The menu is mounted in a `LegacyRoot` so the React 17 timing the bug needs
 * is deterministic here. The `play` function opens the menu and asserts the
 * popover actually becomes visible. Remove the `transition` rule from
 * `MenuSurface` in `menu/styles.ts` and this story fails — the popover stays
 * at `opacity: 0`.
 */
export const PopoverVisibleInLegacyRoot: StoryObj< typeof Menu > = {
	render: () => (
		<LegacyRoot>
			<Menu>
				<Menu.TriggerButton
					render={
						<Button __next40pxDefaultSize variant="secondary" />
					}
				>
					Open menu
				</Menu.TriggerButton>
				<Menu.Popover>
					<Menu.Item>
						<Menu.ItemLabel>One</Menu.ItemLabel>
					</Menu.Item>
					<Menu.Item>
						<Menu.ItemLabel>Two</Menu.ItemLabel>
					</Menu.Item>
				</Menu.Popover>
			</Menu>
		</LegacyRoot>
	),

	play: async ( { canvasElement } ) => {
		const canvas = within( canvasElement );

		await userEvent.click(
			await canvas.findByRole( 'button', { name: 'Open menu' } )
		);

		// The popover portals out of the story root, so query the document.
		const surface = await screen.findByRole( 'menu' );
		const motionRoot = surface.parentElement as HTMLElement;

		// Without the fix the surface never receives `data-enter` and its
		// `MenuMotionRoot` wrapper stays at `opacity: 0` — invisible.
		await waitFor( () => {
			expect( surface.hasAttribute( 'data-enter' ) ).toBe( true );
			expect( getComputedStyle( motionRoot ).opacity ).toBe( '1' );
		} );
	},

	parameters: {
		docs: {
			source: { type: 'code' },
		},
	},
};
