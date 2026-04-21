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
		swipeDirection: 'left',
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

function AllSidesContent() {
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
}

/**
 * Four drawers, one for each swipe direction. Each trigger opens a
 * drawer from the corresponding edge.
 */
export const AllSides: Story = {
	render: () => <AllSidesContent />,
};

function ControlledContent() {
	const [ open, setOpen ] = useState( false );

	return (
		<Drawer.Root
			open={ open }
			onOpenChange={ setOpen }
			swipeDirection="left"
		>
			<Drawer.Trigger>Open Controlled Drawer</Drawer.Trigger>
			<Drawer.Popup>
				<Drawer.Header>
					<Drawer.Title>Controlled Drawer</Drawer.Title>
					<Drawer.CloseIcon />
				</Drawer.Header>
				<Drawer.Description>
					The open state is managed externally via <code>open</code>{ ' ' }
					and <code>onOpenChange</code>.
				</Drawer.Description>
				<Drawer.Footer>
					<Drawer.Action>Close</Drawer.Action>
				</Drawer.Footer>
			</Drawer.Popup>
		</Drawer.Root>
	);
}

/**
 * A controlled drawer where the open state is managed externally.
 */
export const Controlled: Story = {
	render: () => <ControlledContent />,
};

function NonModalContent() {
	return (
		<Drawer.Root swipeDirection="right" modal={ false }>
			<Drawer.Trigger>Open Non-Modal Drawer</Drawer.Trigger>
			<Drawer.Popup>
				<Drawer.Header>
					<Drawer.Title>Non-Modal</Drawer.Title>
					<Drawer.CloseIcon />
				</Drawer.Header>
				<Drawer.Description>
					This drawer does not trap focus and allows interaction with
					the rest of the page while open.
				</Drawer.Description>
				<Drawer.Footer>
					<Drawer.Action>Close</Drawer.Action>
				</Drawer.Footer>
			</Drawer.Popup>
		</Drawer.Root>
	);
}

/**
 * A non-modal drawer that does not trap focus or lock page scroll.
 * Users can interact with content behind the drawer while it is open.
 */
export const NonModal: Story = {
	render: () => <NonModalContent />,
};

const navItems = [
	'Overview',
	'Components',
	'Utilities',
	'Patterns',
	'Releases',
	'Contributing',
];

const navItemStyle: React.CSSProperties = {
	display: 'block',
	width: '100%',
	padding: '12px 16px',
	borderRadius: '8px',
	backgroundColor: 'var(--wpds-color-bg-surface-neutral)',
	color: 'var(--wpds-color-fg-content-neutral)',
	textDecoration: 'none',
	boxSizing: 'border-box',
};

function MobileNavigationContent() {
	return (
		<Drawer.Root>
			<Drawer.Trigger>Open Menu</Drawer.Trigger>
			<Drawer.Popup>
				<Drawer.Header>
					<Drawer.Title>Menu</Drawer.Title>
					<Drawer.CloseIcon />
				</Drawer.Header>
				<Stack direction="column" gap="lg">
					<Drawer.Description>
						Swipe down to dismiss.
					</Drawer.Description>
					<nav>
						<ul
							style={ {
								listStyle: 'none',
								padding: 0,
								margin: 0,
								display: 'grid',
								gap: '4px',
							} }
						>
							{ navItems.map( ( item ) => (
								<li key={ item }>
									<button
										type="button"
										style={ navItemStyle }
									>
										{ item }
									</button>
								</li>
							) ) }
						</ul>
					</nav>
				</Stack>
				<Drawer.Footer>
					<Drawer.Action>Close</Drawer.Action>
				</Drawer.Footer>
			</Drawer.Popup>
		</Drawer.Root>
	);
}

/**
 * A bottom sheet used as a mobile navigation menu. The default
 * `swipeDirection` (`"down"`) makes it dismissible by swiping down.
 */
export const MobileNavigation: Story = {
	render: () => <MobileNavigationContent />,
};

const ALL_SIZES = [ 'small', 'medium', 'large', 'stretch', 'auto' ] as const;

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

function SizePlaygroundContent() {
	const [ size, setSize ] =
		useState< ComponentProps< typeof Drawer.Popup >[ 'size' ] >();
	const [ direction, setDirection ] =
		useState< ComponentProps< typeof Drawer.Root >[ 'swipeDirection' ] >(
			'left'
		);

	return (
		<Drawer.Root swipeDirection={ direction }>
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
						Use the dropdowns to change the size and direction. Both
						inside and outside controls stay in sync.
					</Drawer.Description>
				</Stack>
				<Drawer.Footer>
					<Drawer.Action>Got it</Drawer.Action>
				</Drawer.Footer>
			</Drawer.Popup>
		</Drawer.Root>
	);
}

/**
 * Interactive playground to test the `size` prop across all swipe
 * directions. Size controls the width (left/right) or height (up/down).
 */
export const SizePlayground: Story = {
	render: () => <SizePlaygroundContent />,
};

const actionItemStyle: React.CSSProperties = {
	display: 'block',
	width: '100%',
	padding: '14px 16px',
	border: 'none',
	borderBottom: '1px solid var(--wpds-color-stroke-surface-neutral-weak)',
	backgroundColor: 'transparent',
	color: 'var(--wpds-color-fg-content-neutral)',
	fontFamily: 'var(--wpds-typography-font-family-body)',
	fontSize: 'var(--wpds-typography-font-size-md)',
	textAlign: 'start' as const,
	cursor: 'pointer',
	boxSizing: 'border-box',
};

function ActionSheetContent() {
	return (
		<Drawer.Root>
			<Drawer.Trigger>Open Action Sheet</Drawer.Trigger>
			<Drawer.Popup>
				<Drawer.Header>
					<Drawer.Title>Photo Options</Drawer.Title>
				</Drawer.Header>

				<div
					style={ {
						borderRadius: '8px',
						border: '1px solid var(--wpds-color-stroke-surface-neutral-weak)',
						overflow: 'hidden',
					} }
				>
					<button style={ actionItemStyle }>Take Photo</button>
					<button style={ actionItemStyle }>
						Choose from Library
					</button>
					<button
						style={ {
							...actionItemStyle,
							borderBottom: 'none',
						} }
					>
						Browse Files
					</button>
				</div>

				<Drawer.Footer>
					<Drawer.Action
						variant="outline"
						style={ {
							width: '100%',
							color: 'var(--wpds-color-fg-content-error)',
						} }
					>
						Delete Photo
					</Drawer.Action>
				</Drawer.Footer>
			</Drawer.Popup>
		</Drawer.Root>
	);
}

/**
 * An action sheet presented as a bottom drawer with a grouped list of
 * actions and a separate destructive action. This pattern is common on
 * mobile for contextual menus.
 */
export const ActionSheet: Story = {
	render: () => <ActionSheetContent />,
};
