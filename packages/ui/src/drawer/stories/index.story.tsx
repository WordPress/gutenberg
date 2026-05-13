import type { Meta, StoryObj } from '@storybook/react-vite';
import { useId, useState } from '@wordpress/element';
import type { ComponentProps } from 'react';
import { Stack } from '../../stack';
import * as Drawer from '../index';

const meta: Meta< typeof Drawer.Root > = {
	title: 'Design System/Components/Drawer',
	component: Drawer.Root,
	subcomponents: {
		'Drawer.Trigger': Drawer.Trigger,
		'Drawer.Portal': Drawer.Portal,
		'Drawer.Popup': Drawer.Popup,
		'Drawer.Header': Drawer.Header,
		'Drawer.Title': Drawer.Title,
		'Drawer.Description': Drawer.Description,
		'Drawer.Content': Drawer.Content,
		'Drawer.CloseIcon': Drawer.CloseIcon,
		'Drawer.Action': Drawer.Action,
		'Drawer.Footer': Drawer.Footer,
	},
	argTypes: {
		modal: {
			control: 'inline-radio',
			options: [ true, false, 'trap-focus' ],
		},
	},
	parameters: {
		componentStatus: {
			status: 'use-with-caution',
			whereUsed: 'global',
			notes: 'Not yet recommended for use alongside components from `@wordpress/components`, pending review of overlays compatibility. See [WordPress/gutenberg#76135](https://github.com/WordPress/gutenberg/issues/76135).',
		},
	},
};
export default meta;

type Story = StoryObj< typeof Drawer.Root >;

/**
 * A basic drawer sliding in from the left edge. Use the controls to
 * experiment with `swipeDirection` and `modal`.
 */
export const _Default: Story = {
	args: {
		children: (
			<>
				<Drawer.Trigger>Open Drawer</Drawer.Trigger>
				<Drawer.Popup>
					<Drawer.Header>
						<Drawer.Title>Navigation</Drawer.Title>
						<Drawer.CloseIcon />
					</Drawer.Header>
					<Drawer.Content>
						<Drawer.Description>
							Browse through the available sections below.
						</Drawer.Description>
					</Drawer.Content>
					<Drawer.Footer>
						<Drawer.Action>Done</Drawer.Action>
					</Drawer.Footer>
				</Drawer.Popup>
			</>
		),
	},
};

const directions = [
	{ swipeDirection: 'left', label: 'Left', title: 'Left Drawer' },
	{ swipeDirection: 'right', label: 'Right', title: 'Right Drawer' },
	{ swipeDirection: 'down', label: 'Bottom', title: 'Bottom Sheet' },
	{ swipeDirection: 'up', label: 'Top', title: 'Top Drawer' },
] as const;

/**
 * Four drawers, one for each swipe direction. Each trigger opens a
 * drawer from the corresponding edge.
 */
export const AllSides: Story = {
	render: function AllSidesRender( args ) {
		return (
			<div
				style={ {
					display: 'grid',
					gridTemplateColumns: '1fr 1fr',
					gap: '8px',
					maxWidth: '300px',
				} }
			>
				{ directions.map( ( { swipeDirection, label, title } ) => (
					<Drawer.Root
						key={ swipeDirection }
						{ ...args }
						swipeDirection={ swipeDirection }
					>
						<Drawer.Trigger>{ label }</Drawer.Trigger>
						<Drawer.Popup>
							<Drawer.Header>
								<Drawer.Title>{ title }</Drawer.Title>
								<Drawer.CloseIcon />
							</Drawer.Header>
							<Drawer.Content>
								<Drawer.Description>
									Slides in from the { label.toLowerCase() }{ ' ' }
									edge. Swipe to dismiss.
								</Drawer.Description>
							</Drawer.Content>
							<Drawer.Footer>
								<Drawer.Action>Close</Drawer.Action>
							</Drawer.Footer>
						</Drawer.Popup>
					</Drawer.Root>
				) ) }
			</div>
		);
	},
	argTypes: {
		children: { control: false },
		swipeDirection: { control: false },
	},
};

/**
 * A controlled drawer where the open state is managed externally.
 */
export const Controlled: Story = {
	render: function ControlledRender( args ) {
		const [ open, setOpen ] = useState( false );
		return (
			<Drawer.Root { ...args } open={ open } onOpenChange={ setOpen }>
				{ args.children }
			</Drawer.Root>
		);
	},
	args: {
		children: (
			<>
				<Drawer.Trigger>Open Controlled Drawer</Drawer.Trigger>
				<Drawer.Popup>
					<Drawer.Header>
						<Drawer.Title>Controlled Drawer</Drawer.Title>
						<Drawer.CloseIcon />
					</Drawer.Header>
					<Drawer.Content>
						<Drawer.Description>
							The open state is managed externally via{ ' ' }
							<code>open</code> and <code>onOpenChange</code>.
						</Drawer.Description>
					</Drawer.Content>
					<Drawer.Footer>
						<Drawer.Action>Close</Drawer.Action>
					</Drawer.Footer>
				</Drawer.Popup>
			</>
		),
	},
	argTypes: {
		open: { control: false },
		defaultOpen: { control: false },
		onOpenChange: { control: false },
		onOpenChangeComplete: { control: false },
	},
};

/**
 * A non-modal drawer that does not trap focus or lock page scroll.
 * Users can interact with content behind the drawer while it is open.
 */
export const NonModal: Story = {
	args: {
		swipeDirection: 'right',
		modal: false,
		children: (
			<>
				<Drawer.Trigger>Open Non-Modal Drawer</Drawer.Trigger>
				<Drawer.Popup>
					<Drawer.Header>
						<Drawer.Title>Non-Modal</Drawer.Title>
						<Drawer.CloseIcon />
					</Drawer.Header>
					<Drawer.Content>
						<Drawer.Description>
							This drawer does not trap focus and allows
							interaction with the rest of the page while open.
						</Drawer.Description>
					</Drawer.Content>
					<Drawer.Footer>
						<Drawer.Action>Close</Drawer.Action>
					</Drawer.Footer>
				</Drawer.Popup>
			</>
		),
	},
	render: function NonModalRender( args ) {
		return <Drawer.Root { ...args }>{ args.children }</Drawer.Root>;
	},
};

const ALL_SIZES: NonNullable<
	ComponentProps< typeof Drawer.Popup >[ 'size' ]
>[] = [ 'small', 'medium', 'large', 'stretch', 'auto' ];

function SizeSelector( {
	value,
	onChange,
}: {
	value: ComponentProps< typeof Drawer.Popup >[ 'size' ];
	onChange: ( size: ComponentProps< typeof Drawer.Popup >[ 'size' ] ) => void;
} ) {
	const selectId = useId();
	return (
		<div style={ { display: 'flex', gap: 8, alignItems: 'center' } }>
			<label htmlFor={ selectId }>Size</label>
			<select
				id={ selectId }
				value={ value ?? '' }
				onChange={ ( e ) =>
					onChange(
						( e.target.value || undefined ) as ComponentProps<
							typeof Drawer.Popup
						>[ 'size' ]
					)
				}
			>
				<option value="">default</option>
				{ ALL_SIZES.map( ( s ) => (
					<option key={ s } value={ s }>
						{ s }
					</option>
				) ) }
			</select>
		</div>
	);
}

function DirectionSelector( {
	value,
	onChange,
}: {
	value: ComponentProps< typeof Drawer.Root >[ 'swipeDirection' ];
	onChange: (
		dir: ComponentProps< typeof Drawer.Root >[ 'swipeDirection' ]
	) => void;
} ) {
	const selectId = useId();
	return (
		<div style={ { display: 'flex', gap: 8, alignItems: 'center' } }>
			<label htmlFor={ selectId }>Direction</label>
			<select
				id={ selectId }
				value={ value }
				onChange={ ( e ) =>
					onChange(
						e.target.value as ComponentProps<
							typeof Drawer.Root
						>[ 'swipeDirection' ]
					)
				}
			>
				{ ( [ 'left', 'right', 'down', 'up' ] as const ).map( ( d ) => (
					<option key={ d } value={ d }>
						{ d }
					</option>
				) ) }
			</select>
		</div>
	);
}

/**
 * Popovers in Gutenberg are managed with explicit z-index values, which can
 * create situations where a drawer renders below another popover when you
 * want it above.
 *
 * The `--wp-ui-drawer-z-index` CSS variable controls the z-index of the
 * drawer's backdrop, viewport, and popup. Override it either:
 *
 * - **Globally**, by setting the variable on `:root` or `body` (raises every
 *   drawer in the page), or
 * - **Per instance**, by passing a `Drawer.Portal` with a `style` (or
 *   `className`) to `Drawer.Popup`'s `portal` prop. The variable cascades
 *   from the portal wrapper to everything rendered inside it.
 *
 * This story demonstrates the per-instance approach.
 */
export const WithCustomZIndex: Story = {
	name: 'With Custom z-index',
	args: {
		children: (
			<>
				<Drawer.Trigger>Open Drawer</Drawer.Trigger>
				<Drawer.Popup
					portal={
						<Drawer.Portal
							style={ { '--wp-ui-drawer-z-index': '9999' } }
						/>
					}
				>
					<Drawer.Header>
						<Drawer.Title>Custom z-index</Drawer.Title>
						<Drawer.CloseIcon />
					</Drawer.Header>
					<Drawer.Content>
						<Drawer.Description>
							The backdrop, viewport, and popup render at
							`z-index: 9999` via the `--wp-ui-drawer-z-index` CSS
							custom property, set on `Drawer.Portal` through the
							`portal` prop.
						</Drawer.Description>
					</Drawer.Content>
					<Drawer.Footer>
						<Drawer.Action>Got it</Drawer.Action>
					</Drawer.Footer>
				</Drawer.Popup>
			</>
		),
	},
};

/**
 * Interactive playground to test the `size` prop across all swipe
 * directions. Size controls the width (left/right) or height (up/down).
 */
export const SizePlayground: Story = {
	render: function SizePlaygroundRender( args ) {
		const [ size, setSize ] =
			useState< ComponentProps< typeof Drawer.Popup >[ 'size' ] >();
		const [ direction, setDirection ] = useState<
			ComponentProps< typeof Drawer.Root >[ 'swipeDirection' ]
		>( args.swipeDirection ?? 'left' );
		return (
			<Drawer.Root { ...args } swipeDirection={ direction }>
				<div
					style={ {
						display: 'flex',
						flexDirection: 'column',
						gap: 16,
						alignItems: 'start',
					} }
				>
					<DirectionSelector
						value={ direction }
						onChange={ setDirection }
					/>
					<SizeSelector value={ size } onChange={ setSize } />
					<Drawer.Trigger>Open Drawer</Drawer.Trigger>
				</div>
				<Drawer.Popup size={ size }>
					<Drawer.Header>
						<Drawer.Title>Size Playground</Drawer.Title>
						<Drawer.CloseIcon />
					</Drawer.Header>
					<Drawer.Content>
						<Stack direction="column" gap="lg">
							<div
								style={ {
									display: 'grid',
									gap: 8,
								} }
							>
								<SizeSelector
									value={ size }
									onChange={ setSize }
								/>
								<DirectionSelector
									value={ direction }
									onChange={ setDirection }
								/>
							</div>
							<Drawer.Description>
								Use the dropdowns to change the size and
								direction. Both inside and outside controls stay
								in sync.
							</Drawer.Description>
						</Stack>
					</Drawer.Content>
					<Drawer.Footer>
						<Drawer.Action>Got it</Drawer.Action>
					</Drawer.Footer>
				</Drawer.Popup>
			</Drawer.Root>
		);
	},
	argTypes: {
		swipeDirection: { control: false },
	},
};

type ScrollableControlProps = {
	size: ComponentProps< typeof Drawer.Popup >[ 'size' ];
	setSize: ( size: ComponentProps< typeof Drawer.Popup >[ 'size' ] ) => void;
	direction: ComponentProps< typeof Drawer.Root >[ 'swipeDirection' ];
	setDirection: (
		dir: ComponentProps< typeof Drawer.Root >[ 'swipeDirection' ]
	) => void;
	stickyHeader: boolean;
	setStickyHeader: ( value: boolean ) => void;
	stickyFooter: boolean;
	setStickyFooter: ( value: boolean ) => void;
};

function StickyToggle( {
	stickyHeader,
	stickyFooter,
	setStickyHeader,
	setStickyFooter,
}: Pick<
	ScrollableControlProps,
	'stickyHeader' | 'stickyFooter' | 'setStickyHeader' | 'setStickyFooter'
> ) {
	const headerId = useId();
	const footerId = useId();
	return (
		<Stack direction="row" gap="md" align="center">
			<Stack direction="row" gap="xs" align="center">
				<input
					id={ headerId }
					type="checkbox"
					checked={ stickyHeader }
					onChange={ ( e ) => setStickyHeader( e.target.checked ) }
				/>
				<label htmlFor={ headerId }>Sticky header</label>
			</Stack>
			<Stack direction="row" gap="xs" align="center">
				<input
					id={ footerId }
					type="checkbox"
					checked={ stickyFooter }
					onChange={ ( e ) => setStickyFooter( e.target.checked ) }
				/>
				<label htmlFor={ footerId }>Sticky footer</label>
			</Stack>
		</Stack>
	);
}

function ScrollableControls( {
	size,
	setSize,
	direction,
	setDirection,
	stickyHeader,
	setStickyHeader,
	stickyFooter,
	setStickyFooter,
}: ScrollableControlProps ) {
	return (
		<Stack direction="column" gap="sm" align="start">
			<Stack direction="row" gap="lg" align="center">
				<SizeSelector value={ size } onChange={ setSize } />
				<DirectionSelector
					value={ direction }
					onChange={ setDirection }
				/>
			</Stack>
			<StickyToggle
				stickyHeader={ stickyHeader }
				stickyFooter={ stickyFooter }
				setStickyHeader={ setStickyHeader }
				setStickyFooter={ setStickyFooter }
			/>
		</Stack>
	);
}

/**
 * When drawer content overflows the available space, `Drawer.Content`
 * scrolls while `Drawer.Header` and `Drawer.Footer` stay pinned to the
 * popup's edges. Separator lines appear only when there is off-screen
 * content above the header or below the footer.
 *
 * To let the header or footer scroll with the body instead of staying
 * pinned, render it *inside* `Drawer.Content` rather than as a sibling.
 * The inline "Sticky header / Sticky footer" checkboxes toggle exactly
 * that placement at runtime.
 *
 * Use the inline controls to change the popup `size`, `swipeDirection`,
 * and sticky placement. The same controls render both outside and inside
 * the drawer and stay in sync.
 */
export const Scrollable: Story = {
	render: function ScrollableRender( args ) {
		const [ size, setSize ] =
			useState< ComponentProps< typeof Drawer.Popup >[ 'size' ] >();
		const [ direction, setDirection ] = useState<
			ComponentProps< typeof Drawer.Root >[ 'swipeDirection' ]
		>( args.swipeDirection ?? 'left' );
		const [ stickyHeader, setStickyHeader ] = useState( true );
		const [ stickyFooter, setStickyFooter ] = useState( true );
		const controlProps: ScrollableControlProps = {
			size,
			setSize,
			direction,
			setDirection,
			stickyHeader,
			setStickyHeader,
			stickyFooter,
			setStickyFooter,
		};

		const header = (
			<Drawer.Header>
				<Drawer.Title>Terms of service</Drawer.Title>
				<Drawer.CloseIcon />
			</Drawer.Header>
		);
		const footer = (
			<Drawer.Footer>
				<Drawer.Action variant="outline">Decline</Drawer.Action>
				<Drawer.Action>Accept</Drawer.Action>
			</Drawer.Footer>
		);

		return (
			<Drawer.Root { ...args } swipeDirection={ direction }>
				<Stack direction="column" gap="lg" align="start">
					<ScrollableControls { ...controlProps } />
					<Drawer.Trigger>Open Drawer</Drawer.Trigger>
				</Stack>
				<Drawer.Popup size={ size }>
					{ stickyHeader && header }
					<Drawer.Content>
						{ ! stickyHeader && header }
						<Stack direction="column" gap="lg">
							<ScrollableControls { ...controlProps } />
							{ Array.from( { length: 20 } ).map(
								( _, index ) => (
									<p key={ index } style={ { margin: 0 } }>
										Paragraph { index + 1 }: Lorem ipsum
										dolor sit amet, consectetur adipiscing
										elit. Sed do eiusmod tempor incididunt
										ut labore et dolore magna aliqua. Ut
										enim ad minim veniam, quis nostrud
										exercitation ullamco laboris nisi ut
										aliquip ex ea commodo consequat.
									</p>
								)
							) }
						</Stack>
						{ ! stickyFooter && footer }
					</Drawer.Content>
					{ stickyFooter && footer }
				</Drawer.Popup>
			</Drawer.Root>
		);
	},
	argTypes: {
		swipeDirection: { control: false },
	},
};
