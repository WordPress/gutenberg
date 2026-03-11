import type { Meta, StoryObj } from '@storybook/react-vite';
import {
	createContext,
	createPortal,
	useContext,
	useId,
	useLayoutEffect,
	useRef,
	useState,
} from '@wordpress/element';
import type { RefCallback } from 'react';
import { Popover } from '../..';

const meta: Meta< typeof Popover.Root > = {
	title: 'Design System/Components/Popover',
	component: Popover.Root,
	subcomponents: {
		'Popover.Trigger': Popover.Trigger,
		'Popover.Popup': Popover.Popup,
		'Popover.Arrow': Popover.Arrow,
		'Popover.Title': Popover.Title,
		'Popover.Description': Popover.Description,
		'Popover.Close': Popover.Close,
	},
	parameters: {
		docs: {
			description: {
				component:
					'Popover is an accessible popup anchored to a trigger button. ' +
					'It can contain interactive content and form controls.',
			},
		},
	},
};
export default meta;

type Story = StoryObj< typeof Popover.Root >;

export const Default: Story = {
	args: {
		children: (
			<>
				<Popover.Trigger>Open Popover</Popover.Trigger>
				<Popover.Popup>
					<Popover.Arrow />
					<Popover.Title>Notifications</Popover.Title>
					<Popover.Description>
						You are all caught up. Good job!
					</Popover.Description>
				</Popover.Popup>
			</>
		),
	},
};

/**
 * All combinations of `side` and `align` props on `Popover.Popup`.
 *
 * Each row shows a side (`top`, `right`, `bottom`, `left`), and each column
 * shows an alignment (`start`, `center`, `end`).
 */
export const Positioning: Story = {
	render: function Render() {
		const sides = [ 'top', 'right', 'bottom', 'left' ] as const;
		const aligns = [ 'start', 'center', 'end' ] as const;

		return (
			<div
				style={ {
					display: 'grid',
					gridTemplateColumns: 'repeat(3, 1fr)',
					gap: '6rem',
					padding: '6rem 4rem',
					justifyItems: 'center',
				} }
			>
				{ sides.flatMap( ( side ) =>
					aligns.map( ( align ) => (
						<Popover.Root key={ `${ side }-${ align }` } open>
							<Popover.Trigger>
								{ side } / { align }
							</Popover.Trigger>
							<Popover.Popup
								side={ side }
								align={ align }
								animated={ false }
								collisionAvoidance={ {
									side: 'none',
									align: 'none',
								} }
							>
								<Popover.Arrow />
								<Popover.Description>
									{ side } side / { align } align
								</Popover.Description>
							</Popover.Popup>
						</Popover.Root>
					) )
				) }
			</div>
		);
	},
};

/**
 * A popover with a close button, title, and description. The `Popover.Close`
 * component renders a button that closes the popover when clicked.
 */
export const WithCloseButton: Story = {
	args: {
		children: (
			<>
				<Popover.Trigger>Settings</Popover.Trigger>
				<Popover.Popup>
					<Popover.Arrow />
					<div
						style={ {
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							marginBottom: 8,
						} }
					>
						<Popover.Title style={ { margin: 0 } }>
							Settings
						</Popover.Title>
						<Popover.Close
							style={ {
								all: 'unset',
								cursor: 'pointer',
								lineHeight: 1,
							} }
						>
							&#x2715;
						</Popover.Close>
					</div>
					<Popover.Description>
						Configure your notification preferences and display
						settings.
					</Popover.Description>
				</Popover.Popup>
			</>
		),
	},
};

/**
 * Use the `open` and `onOpenChange` props on `Popover.Root` to control the
 * popover's visibility programmatically.
 *
 * The checkbox drives the popover state externally. The popover's trigger
 * and click-outside dismiss both sync back to the same state via
 * `onOpenChange`, keeping everything in sync.
 */
export const Controlled: Story = {
	render: function Render() {
		const [ isOpen, setIsOpen ] = useState( false );
		const checkboxId = useId();

		return (
			<div
				style={ {
					display: 'flex',
					gap: '1rem',
					alignItems: 'center',
				} }
			>
				<Popover.Root open={ isOpen } onOpenChange={ setIsOpen }>
					<Popover.Trigger>Toggle Popover</Popover.Trigger>
					<Popover.Popup>
						<Popover.Arrow />
						<Popover.Title>Controlled Popover</Popover.Title>
						<Popover.Description>
							This popover is controlled by external state.
						</Popover.Description>
					</Popover.Popup>
				</Popover.Root>
				<label htmlFor={ checkboxId }>
					<input
						id={ checkboxId }
						type="checkbox"
						checked={ isOpen }
						onChange={ ( e ) => setIsOpen( e.target.checked ) }
					/>{ ' ' }
					Open
				</label>
			</div>
		);
	},
};

/**
 * Set `modal` to `true` to trap focus inside the popover when it is open.
 * This is useful for complex popover content that requires user interaction,
 * such as forms. Try tabbing through the fields — focus stays inside the
 * popover until it is dismissed.
 */
export const Modal: Story = {
	render: function Render() {
		const nameId = useId();
		const emailId = useId();

		return (
			<Popover.Root modal>
				<Popover.Trigger>Edit Settings</Popover.Trigger>
				<Popover.Popup>
					<Popover.Arrow />
					<Popover.Title>Settings</Popover.Title>
					<form
						style={ {
							display: 'flex',
							flexDirection: 'column',
							gap: 8,
							marginTop: 8,
						} }
						onSubmit={ ( e ) => e.preventDefault() }
					>
						<label
							htmlFor={ nameId }
							style={ {
								display: 'flex',
								flexDirection: 'column',
								gap: 4,
								fontSize: 'inherit',
							} }
						>
							Name
							<input
								id={ nameId }
								type="text"
								placeholder="Enter your name"
							/>
						</label>
						<label
							htmlFor={ emailId }
							style={ {
								display: 'flex',
								flexDirection: 'column',
								gap: 4,
								fontSize: 'inherit',
							} }
						>
							Email
							<input
								id={ emailId }
								type="email"
								placeholder="Enter your email"
							/>
						</label>
						<div
							style={ {
								display: 'flex',
								justifyContent: 'flex-end',
								gap: 8,
								marginTop: 4,
							} }
						>
							<Popover.Close
								style={ {
									all: 'unset',
									cursor: 'pointer',
								} }
							>
								Cancel
							</Popover.Close>
							<button type="submit">Save</button>
						</div>
					</form>
				</Popover.Popup>
			</Popover.Root>
		);
	},
};

/**
 * The `variant="unstyled"` option strips all visual styling from the popup,
 * making it a blank positioning container for fully custom content.
 */
export const Unstyled: Story = {
	args: {
		children: (
			<>
				<Popover.Trigger>Open Unstyled</Popover.Trigger>
				<Popover.Popup variant="unstyled">
					<Popover.Title>Custom Styled</Popover.Title>
					<Popover.Description>
						This popup has no default styling — the consumer
						controls all visual appearance.
					</Popover.Description>
				</Popover.Popup>
			</>
		),
	},
};

function useMeasure< TRef extends HTMLElement >() {
	const [ element, setElement ] = useState< TRef | null >( null );
	const [ elementSize, setElementSize ] = useState( {
		width: 0,
		height: 0,
	} );

	useLayoutEffect( () => {
		if ( ! element ) {
			return;
		}

		function update() {
			const bcr = element!.getBoundingClientRect();
			setElementSize( {
				width: bcr.width,
				height: bcr.height,
			} );
		}

		const resizeObserver = new ResizeObserver( () => {
			update();
		} );
		resizeObserver.observe( element );
		update();

		return () => {
			resizeObserver.disconnect();
		};
	}, [ element ] );

	const elementRef: RefCallback< TRef > = ( node ) => {
		setElement( node );
	};

	return [ elementRef, elementSize ] as const;
}

/**
 * Overlay placement positions the popover centered on top of its trigger,
 * effectively covering it. This is achieved by computing a negative
 * `sideOffset` based on the measured sizes of the trigger and popup.
 *
 * This technique is useful when you want the popover to visually replace
 * the trigger element in place.
 */
export const OverlayPlacement: Story = {
	render: function Render() {
		const [ popupRef, popupSize ] = useMeasure< HTMLDivElement >();
		const [ triggerRef, triggerSize ] = useMeasure< HTMLButtonElement >();

		return (
			<div style={ { padding: '4rem', textAlign: 'center' } }>
				<Popover.Root defaultOpen>
					<Popover.Trigger ref={ triggerRef }>
						Trigger (covered by popover)
					</Popover.Trigger>
					<Popover.Popup
						ref={ popupRef }
						side="bottom"
						align="center"
						sideOffset={
							-1 *
							( popupSize.height / 2 + triggerSize.height / 2 )
						}
						collisionAvoidance={ {
							side: 'none',
							align: 'none',
						} }
					>
						<Popover.Title>Overlay</Popover.Title>
						<Popover.Description>
							This popover is centered over its trigger using a
							negative sideOffset.
						</Popover.Description>
						<Popover.Description>
							Try resizing the browser — collision avoidance is
							disabled so the popover stays overlaid.
						</Popover.Description>
					</Popover.Popup>
				</Popover.Root>
			</div>
		);
	},
};

/**
 * Set `animated` to `false` on `Popover.Popup` to disable the open/close
 * transition. The popover will appear and disappear instantly.
 */
export const DisabledAnimations: Story = {
	args: {
		children: (
			<>
				<Popover.Trigger>No Animation</Popover.Trigger>
				<Popover.Popup animated={ false }>
					<Popover.Arrow />
					<Popover.Title>Instant</Popover.Title>
					<Popover.Description>
						This popover opens and closes without animation.
					</Popover.Description>
				</Popover.Popup>
			</>
		),
	},
};

/**
 * When `inline` is set to `true`, the popup renders in place within the DOM
 * hierarchy instead of being portaled to `document.body`. This can be
 * useful when you need the popup to participate in the surrounding layout
 * or inherit styles from a parent.
 */
export const Inline: Story = {
	args: {
		children: (
			<>
				<Popover.Trigger>Open Inline</Popover.Trigger>
				<Popover.Popup inline>
					<Popover.Arrow />
					<Popover.Title>Inline Popover</Popover.Title>
					<Popover.Description>
						This popup is rendered in place — no portal is used.
						Inspect the DOM to see it lives inside its parent.
					</Popover.Description>
				</Popover.Popup>
			</>
		),
	},
};

/**
 * Use the `collisionAvoidance` prop to control how the popover behaves when
 * it collides with viewport edges.
 *
 * - `side: 'flip'` flips to the opposite side (default).
 * - `side: 'shift'` shifts along the main axis.
 * - `side: 'none'` disables collision handling.
 *
 * Scroll the container to see collision avoidance in action.
 */
export const CollisionAvoidance: Story = {
	render: () => (
		<div
			style={ {
				height: 300,
				overflow: 'auto',
				border: '1px solid #ccc',
				padding: '200px 2rem',
			} }
		>
			<div
				style={ {
					display: 'flex',
					gap: '2rem',
					justifyContent: 'center',
				} }
			>
				<Popover.Root defaultOpen>
					<Popover.Trigger>Flip (default)</Popover.Trigger>
					<Popover.Popup side="top">
						<Popover.Title>Flip</Popover.Title>
						<Popover.Description>
							Flips to bottom when clipped
						</Popover.Description>
					</Popover.Popup>
				</Popover.Root>

				<Popover.Root defaultOpen>
					<Popover.Trigger>No collision</Popover.Trigger>
					<Popover.Popup
						side="top"
						collisionAvoidance={ {
							side: 'none',
							align: 'none',
						} }
					>
						<Popover.Title>None</Popover.Title>
						<Popover.Description>
							Stays on top even when clipped
						</Popover.Description>
					</Popover.Popup>
				</Popover.Root>
			</div>
			<div style={ { height: 600 } } />
		</div>
	),
};

function GenericIframe( {
	children,
	...props
}: React.ComponentProps< 'iframe' > & { children: React.ReactNode } ) {
	const [ containerNode, setContainerNode ] = useState< HTMLElement | null >(
		null
	);

	return (
		<iframe
			title="Iframe"
			{ ...props }
			srcDoc="<!doctype html><html><body></body></html>"
			// Waiting for the load event ensures that this works in Firefox.
			// See https://github.com/facebook/react/issues/22847#issuecomment-991394558
			onLoad={ ( event ) => {
				const doc = event.currentTarget.contentDocument;
				if ( doc ) {
					setContainerNode( doc.body );
				}
			} }
		>
			{ containerNode && createPortal( children, containerNode ) }
		</iframe>
	);
}

/**
 * When the popover's trigger lives inside an iframe but the popover should
 * render in the parent document, pass a parent-document element to the
 * `container` prop on `Popover.Popup`.
 *
 * This technique is used in Gutenberg where the block editor canvas is an
 * iframe but toolbars and menus must appear outside it.
 *
 * Scroll inside the iframe to verify that the popover tracks the trigger
 * position across document boundaries.
 */
export const CrossIframe: Story = {
	render: function Render() {
		const portalContainerRef = useRef< HTMLDivElement >( null );

		return (
			<div>
				<div ref={ portalContainerRef } />
				<GenericIframe
					style={ {
						width: '100%',
						height: 400,
						border: 0,
						outline: '1px solid purple',
					} }
				>
					<div
						style={ {
							height: '200vh',
							paddingTop: '10vh',
						} }
					>
						<div
							style={ {
								maxWidth: 200,
								marginTop: 100,
								marginInline: 'auto',
							} }
						>
							<Popover.Root defaultOpen>
								<Popover.Trigger
									style={ {
										padding: 8,
										background: 'salmon',
									} }
								>
									Popover&apos;s anchor (inside iframe)
								</Popover.Trigger>
								<Popover.Popup
									container={
										portalContainerRef as React.RefObject< HTMLElement >
									}
								>
									<Popover.Arrow />
									<Popover.Title>
										Cross-Iframe Popover
									</Popover.Title>
									<Popover.Description>
										This popup is rendered in the parent
										document, not inside the iframe. Scroll
										the iframe to see the popover track the
										trigger.
									</Popover.Description>
								</Popover.Popup>
							</Popover.Root>
						</div>
					</div>
				</GenericIframe>
			</div>
		);
	},
};

/**
 * Minimal SlotFill implementation using React context. The `Slot` renders a
 * target `div` and shares its ref via context so that any descendant `Fill`
 * can read it and pass it to `Popover.Popup`'s `container` prop.
 */
const PopoverSlotContext =
	createContext< React.RefObject< HTMLElement > | null >( null );

function PopoverSlotProvider( { children }: { children: React.ReactNode } ) {
	const slotRef = useRef< HTMLDivElement >( null );

	return (
		<PopoverSlotContext.Provider
			value={ slotRef as React.RefObject< HTMLElement > }
		>
			<div ref={ slotRef } />
			{ children }
		</PopoverSlotContext.Provider>
	);
}

function usePopoverSlot() {
	return useContext( PopoverSlotContext );
}

/**
 * Same cross-iframe scenario, but wired through a minimal SlotFill context
 * instead of manually passing a container ref.
 *
 * `PopoverSlotProvider` renders a slot `div` in the parent document and
 * shares its ref via context. Inside the iframe, the popover reads it
 * with `usePopoverSlot()` and passes it to the `container` prop — no
 * manual ref plumbing needed.
 */
export const CrossIframeWithSlotFill: Story = {
	name: 'Cross-Iframe (SlotFill)',
	render: function Render() {
		return (
			<PopoverSlotProvider>
				<GenericIframe
					style={ {
						width: '100%',
						height: 400,
						border: 0,
						outline: '1px solid purple',
					} }
				>
					<div
						style={ {
							height: '200vh',
							paddingTop: '10vh',
						} }
					>
						<div
							style={ {
								maxWidth: 200,
								marginTop: 100,
								marginInline: 'auto',
							} }
						>
							<SlotFillPopover />
						</div>
					</div>
				</GenericIframe>
			</PopoverSlotProvider>
		);
	},
};

function SlotFillPopover() {
	const slot = usePopoverSlot();

	return (
		<Popover.Root defaultOpen>
			<Popover.Trigger
				style={ {
					padding: 8,
					background: 'salmon',
				} }
			>
				Popover&apos;s anchor (inside iframe)
			</Popover.Trigger>
			<Popover.Popup container={ slot }>
				<Popover.Arrow />
				<Popover.Title>Cross-Iframe (SlotFill)</Popover.Title>
				<Popover.Description>
					This popup renders in the parent document via a SlotFill
					context — no manual ref wiring required.
				</Popover.Description>
			</Popover.Popup>
		</Popover.Root>
	);
}

/**
 * The `--wp-ui-popover-z-index` CSS variable controls the z-index of the
 * popover positioner. It can be overridden globally or scoped to a
 * specific container.
 */
export const WithCustomZIndex: Story = {
	...Default,
	name: 'With Custom z-index',
};
