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
					<Drawer.Description>
						Browse through the available sections below.
					</Drawer.Description>
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
							<Drawer.Description>
								Slides in from the { label.toLowerCase() } edge.
								Swipe to dismiss.
							</Drawer.Description>
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
					<Drawer.Description>
						The open state is managed externally via{ ' ' }
						<code>open</code> and <code>onOpenChange</code>.
					</Drawer.Description>
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
					<Drawer.Description>
						This drawer does not trap focus and allows interaction
						with the rest of the page while open.
					</Drawer.Description>
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
 *   from the portal wrapper to everything rendered inside it (backdrop,
 *   viewport, and popup).
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
					<Drawer.Description>
						The backdrop, viewport, and popup render at `z-index:
						9999` via the `--wp-ui-drawer-z-index` CSS custom
						property, set on `Drawer.Portal` through the `portal`
						prop.
					</Drawer.Description>
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
					<Stack direction="column" gap="lg">
						<div
							style={ {
								display: 'grid',
								gap: 8,
							} }
						>
							<SizeSelector value={ size } onChange={ setSize } />
							<DirectionSelector
								value={ direction }
								onChange={ setDirection }
							/>
						</div>
						<Drawer.Description>
							Use the dropdowns to change the size and direction.
							Both inside and outside controls stay in sync.
						</Drawer.Description>
					</Stack>
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
