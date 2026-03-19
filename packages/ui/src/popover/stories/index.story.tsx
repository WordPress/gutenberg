import type { Meta, StoryObj } from '@storybook/react-vite';
import { useId, useRef, useState } from '@wordpress/element';
import { SlotFillProvider, Slot } from '@wordpress/components';
import { Popover } from '../..';
import { GenericIframe, useMeasure } from './utils';

const meta: Meta< typeof Popover.Root > = {
	title: 'Design System/Components/Popover',
	component: Popover.Root,
	subcomponents: {
		'Popover.Trigger': Popover.Trigger,
		'Popover.Popup': Popover.Popup,
		'Popover.Arrow': Popover.Arrow,
		'Popover.Backdrop': Popover.Backdrop,
		'Popover.Title': Popover.Title,
		'Popover.Description': Popover.Description,
		'Popover.Close': Popover.Close,
	},
	argTypes: {
		children: { control: false },
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
	argTypes: {
		children: { control: { type: 'text' } },
	},
	args: {
		children: (
			<>
				<Popover.Trigger>Open Popover</Popover.Trigger>
				<Popover.Popup>
					<Popover.Arrow />
					<Popover.Title>Popover title</Popover.Title>
					<Popover.Description>
						Popover description
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
	parameters: { controls: { disable: true } },
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
	argTypes: {
		open: { control: false },
		onOpenChange: { control: false },
		defaultOpen: { control: false },
	},
	args: {
		children: (
			<>
				<Popover.Trigger>Toggle Popover</Popover.Trigger>
				<Popover.Popup>
					<Popover.Arrow />
					<Popover.Title>Controlled Popover</Popover.Title>
					<Popover.Description>
						This popover is controlled by external state.
					</Popover.Description>
				</Popover.Popup>
			</>
		),
	},
	render: function Render( args ) {
		const [ isOpen, setIsOpen ] = useState( false );
		const checkboxId = useId();
		const checkboxRef = useRef< HTMLInputElement >( null );
		const labelRef = useRef< HTMLLabelElement >( null );

		return (
			<div
				style={ {
					display: 'flex',
					gap: '1rem',
					alignItems: 'center',
				} }
			>
				<Popover.Root
					{ ...args }
					open={ isOpen }
					onOpenChange={ ( nextOpen, eventDetails ) => {
						if (
							[ 'outside-press', 'focus-out' ].includes(
								eventDetails.reason
							) &&
							!! eventDetails.event.target &&
							(
								[
									checkboxRef.current,
									labelRef.current,
								].filter( Boolean ) as EventTarget[]
							 ).includes( eventDetails.event.target )
						) {
							return;
						}

						setIsOpen( nextOpen );
					} }
				/>

				<label htmlFor={ checkboxId } ref={ labelRef }>
					<input
						ref={ checkboxRef }
						id={ checkboxId }
						type="checkbox"
						checked={ isOpen }
						onChange={ ( e ) => setIsOpen( e.target.checked ) }
					/>
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
 *
 * Add `Popover.Backdrop` to display a semi-transparent overlay beneath the
 * popover, signalling that the page is blocked.
 */
export const Modal: Story = {
	argTypes: { modal: { control: false } },
	args: {
		modal: true,
		children: (
			<>
				<Popover.Trigger>Edit Settings</Popover.Trigger>
				<Popover.Backdrop />
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
							htmlFor="popover-test-name-id"
							style={ {
								display: 'flex',
								flexDirection: 'column',
								gap: 4,
								fontSize: 'inherit',
							} }
						>
							Name
							<input
								// eslint-disable-next-line no-restricted-syntax
								id="popover-test-name-id"
								type="text"
								placeholder="Enter your name"
							/>
						</label>
						<label
							htmlFor="popover-test-email-id"
							style={ {
								display: 'flex',
								flexDirection: 'column',
								gap: 4,
								fontSize: 'inherit',
							} }
						>
							Email
							<input
								// eslint-disable-next-line no-restricted-syntax
								id="popover-test-email-id"
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
			</>
		),
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

/**
 * Overlay placement positions the popover centered on top of its trigger,
 * effectively covering it. This is achieved by computing a negative
 * `sideOffset` based on the measured sizes of the trigger and popup.
 *
 * This technique is useful when you want the popover to visually replace
 * the trigger element in place.
 */
export const OverlayPlacement: Story = {
	args: { defaultOpen: true },
	argTypes: { defaultOpen: { control: false } },
	render: function Render( { children: _children, ...args } ) {
		const [ popupRef, popupSize ] = useMeasure< HTMLDivElement >();
		const [ triggerRef, triggerSize ] = useMeasure< HTMLButtonElement >();

		return (
			<div style={ { padding: '4rem', textAlign: 'center' } }>
				<Popover.Root { ...args }>
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
 * it collides with the edges of its collision boundary.
 *
 * Because the popup renders via a portal (outside the scrollable container),
 * the container must be passed as `collisionBoundary` so Floating UI treats
 * it as the clipping edge.
 *
 * - `side: 'flip'` flips to the opposite side (default).
 * - `side: 'none'` disables collision handling.
 *
 * Scroll the container to see collision avoidance in action.
 */
export const CollisionAvoidance: Story = {
	parameters: { controls: { disable: true } },
	render: function Render() {
		const [ boundary, setBoundary ] = useState< HTMLElement | null >(
			null
		);

		return (
			<div
				ref={ setBoundary }
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
						<Popover.Popup
							side="top"
							collisionBoundary={ boundary ?? undefined }
						>
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
							collisionBoundary={ boundary ?? undefined }
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
		);
	},
};

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
	args: { defaultOpen: true },
	argTypes: { defaultOpen: { control: false } },
	render: function Render( { children: _children, ...args } ) {
		const portalContainerRef = useRef< HTMLDivElement >( null );
		const [ iframeBoundary, setIframeBoundary ] =
			useState< HTMLIFrameElement | null >( null );

		return (
			<div>
				<div ref={ portalContainerRef } />
				<GenericIframe
					ref={ setIframeBoundary }
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
							<Popover.Root { ...args }>
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
									collisionBoundary={
										iframeBoundary ?? undefined
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
 * Same cross-iframe scenario, but using `SlotFillProvider` and `Slot` from
 * `@wordpress/components` as the render target.
 *
 * The `Slot` renders a `div` in the parent document, and its forwarded ref
 * is passed to `Popover.Popup`'s `container` prop so the popup portals into
 * the slot element. This mirrors the legacy Popover's `WithSlotOutsideIframe`
 * pattern.
 */
export const CrossIframeWithSlotFill: Story = {
	name: 'Cross-Iframe (SlotFill)',
	args: { defaultOpen: true },
	argTypes: { defaultOpen: { control: false } },
	render: function Render( { children: _children, ...args } ) {
		const slotRef = useRef< HTMLDivElement >( null );
		const [ iframeBoundary, setIframeBoundary ] =
			useState< HTMLIFrameElement | null >( null );

		return (
			<SlotFillProvider>
				<Slot
					name="popover-container"
					bubblesVirtually
					ref={ slotRef }
				/>
				<GenericIframe
					ref={ setIframeBoundary }
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
							<Popover.Root { ...args }>
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
										slotRef as React.RefObject< HTMLElement >
									}
									collisionBoundary={
										iframeBoundary ?? undefined
									}
								>
									<Popover.Arrow />
									<Popover.Title>
										Cross-Iframe (SlotFill)
									</Popover.Title>
									<Popover.Description>
										This popup renders in the parent
										document via a `Slot` from
										`@wordpress/components`.
									</Popover.Description>
								</Popover.Popup>
							</Popover.Root>
						</div>
					</div>
				</GenericIframe>
			</SlotFillProvider>
		);
	},
};

/**
 * Popovers in Gutenberg are managed with explicit z-index values, which can
 * create situations where a popover renders below another popover, when you
 * want it to be rendered above.
 *
 * The `--wp-ui-popover-z-index` CSS variable, available on the
 * `Popover.Popup` component, is an escape hatch that can be used to override
 * the z-index of a given popover on a case-by-case basis.
 */
export const WithCustomZIndex: Story = {
	name: 'With Custom z-index',
	args: {
		children: (
			<>
				<Popover.Trigger>Open Popover</Popover.Trigger>
				<Popover.Popup style={ { '--wp-ui-popover-z-index': '9999' } }>
					<Popover.Arrow />
					<Popover.Title>Custom z-index</Popover.Title>
					<Popover.Description>
						This popover&apos;s positioner has z-index: 9999 via the
						`--wp-ui-popover-z-index` CSS custom property.
					</Popover.Description>
				</Popover.Popup>
			</>
		),
	},
};

/**
 * Use the `anchor` prop on `Popover.Popup` to position the popover against an
 * arbitrary element instead of the built-in trigger. Base UI accepts four
 * anchor types:
 *
 * 1. **Element** — a direct DOM element reference.
 * 2. **VirtualElement** — an object with a `getBoundingClientRect()` method.
 * 3. **RefObject** — a `React.RefObject` pointing to an element.
 * 4. **Callback** — a function returning an Element or VirtualElement.
 *
 * This is the most-used pattern in Gutenberg: block popovers anchor to
 * selected block elements, the link popover anchors to the text selection, and
 * data views anchor to right-click positions.
 */
export const Anchor: Story = {
	parameters: { controls: { disable: true } },
	render: function Render() {
		const [ elementAnchor, setElementAnchor ] =
			useState< HTMLElement | null >( null );
		const refAnchor = useRef< HTMLDivElement >( null );
		const callbackTarget = useRef< HTMLDivElement >( null );

		const virtualAnchor = {
			getBoundingClientRect: () => ( {
				x: 400,
				y: 50,
				width: 0,
				height: 0,
				top: 50,
				right: 400,
				bottom: 50,
				left: 400,
			} ),
		};

		const anchorBoxStyle = {
			padding: '8px 12px',
			border: '2px dashed currentcolor',
			borderRadius: 4,
			fontSize: 12,
			textAlign: 'center' as const,
		};

		const popupProps = {
			animated: false as const,
			collisionAvoidance: {
				side: 'none' as const,
				align: 'none' as const,
			},
		};

		return (
			<div
				style={ {
					display: 'grid',
					gridTemplateColumns: '1fr 1fr',
					gap: '4rem',
					padding: '4rem 2rem',
				} }
			>
				{ /* 1. Element anchor */ }
				<div>
					<div ref={ setElementAnchor } style={ anchorBoxStyle }>
						Element anchor
					</div>
					<Popover.Root open>
						<Popover.Popup
							anchor={ elementAnchor ?? undefined }
							{ ...popupProps }
						>
							<Popover.Arrow />
							<Popover.Description>
								Anchored to a DOM element
							</Popover.Description>
						</Popover.Popup>
					</Popover.Root>
				</div>

				{ /* 2. VirtualElement anchor */ }
				<div>
					<div style={ anchorBoxStyle }>
						VirtualElement anchor (fixed at 400, 50)
					</div>
					<Popover.Root open>
						<Popover.Popup
							anchor={ virtualAnchor }
							{ ...popupProps }
						>
							<Popover.Arrow />
							<Popover.Description>
								Anchored to a virtual element
							</Popover.Description>
						</Popover.Popup>
					</Popover.Root>
				</div>

				{ /* 3. RefObject anchor */ }
				<div>
					<div ref={ refAnchor } style={ anchorBoxStyle }>
						RefObject anchor
					</div>
					<Popover.Root open>
						<Popover.Popup anchor={ refAnchor } { ...popupProps }>
							<Popover.Arrow />
							<Popover.Description>
								Anchored via useRef
							</Popover.Description>
						</Popover.Popup>
					</Popover.Root>
				</div>

				{ /* 4. Callback anchor */ }
				<div>
					<div ref={ callbackTarget } style={ anchorBoxStyle }>
						Callback anchor
					</div>
					<Popover.Root open>
						<Popover.Popup
							anchor={ () => callbackTarget.current }
							{ ...popupProps }
						>
							<Popover.Arrow />
							<Popover.Description>
								Anchored via callback function
							</Popover.Description>
						</Popover.Popup>
					</Popover.Root>
				</div>
			</div>
		);
	},
};

/**
 * Use `variant="unstyled"` and custom inline styles to replicate a toolbar-like
 * appearance: high-contrast border, no shadow, and a smaller border radius.
 *
 * A first-class `variant="toolbar"` may be added in the future if this pattern
 * becomes widespread.
 */
export const ToolbarVariant: Story = {
	args: {
		children: (
			<>
				<Popover.Trigger>Open Toolbar</Popover.Trigger>
				<Popover.Popup
					variant="unstyled"
					style={ {
						display: 'flex',
						gap: 4,
						padding: '4px 8px',
						border: '1px solid #1e1e1e',
						borderRadius: 2,
						background: '#fff',
						fontSize: 13,
					} }
				>
					<button type="button">B</button>
					<button type="button">I</button>
					<button type="button">U</button>
					<button type="button">Link</button>
				</Popover.Popup>
			</>
		),
	},
};

/**
 * Base UI's Positioner exposes `--wp-ui-popover-available-height` and
 * `--wp-ui-popover-available-width` CSS variables representing the space
 * between the anchor and the viewport edge. Apply them as `max-height` /
 * `max-width` on the popup content to constrain its size to the available
 * space — this replaces the legacy Popover's `resize` prop.
 *
 * Open the popover and resize or scroll the container to see the popup shrink
 * to fit.
 */
export const ViewportConstrainedSize: Story = {
	name: 'Viewport-Constrained Size',
	args: { defaultOpen: true },
	argTypes: { defaultOpen: { control: false } },
	render: function Render( { children: _children, ...args } ) {
		return (
			<div
				style={ {
					height: 250,
					overflow: 'auto',
					border: '1px solid #ccc',
					padding: '60px 2rem',
				} }
			>
				<Popover.Root { ...args }>
					<Popover.Trigger>Show Content</Popover.Trigger>
					<Popover.Popup
						side="bottom"
						style={ {
							maxHeight:
								'var(--wp-ui-popover-available-height, 300px)',
							maxWidth:
								'var(--wp-ui-popover-available-width, 300px)',
							overflow: 'auto',
						} }
					>
						<Popover.Title>Constrained</Popover.Title>
						<Popover.Description>
							This popup constrains its size using the
							`--wp-ui-popover-available-height` and
							`--wp-ui-popover-available-width` CSS variables
							exposed by the positioner.
						</Popover.Description>
						<div style={ { height: 400 } }>
							<p>
								Scroll inside this popup — its max-height is
								capped to the available viewport space.
							</p>
						</div>
					</Popover.Popup>
				</Popover.Root>
				<div style={ { height: 600 } } />
			</div>
		);
	},
};

/**
 * The `onOpenChange` callback on `Popover.Root` receives an `eventDetails`
 * object with a `reason` field that describes why the popover is
 * opening/closing. This replaces the legacy Popover's separate `onClose` and
 * `onFocusOutside` callbacks:
 *
 * - `reason === 'escape-key'` — user pressed Escape (was `onClose`)
 * - `reason === 'outside-press'` — user clicked outside (was `onClose`)
 * - `reason === 'focus-out'` — focus moved outside (was `onFocusOutside`)
 *
 * Open the popover, then dismiss it in different ways to see the logged reason.
 */
export const OnOpenChangeDetails: Story = {
	name: 'onOpenChange Details',
	parameters: { controls: { disable: true } },
	render: function Render() {
		const [ log, setLog ] = useState< string[] >( [] );

		return (
			<div style={ { display: 'flex', gap: '2rem' } }>
				<Popover.Root
					onOpenChange={ ( nextOpen, eventDetails ) => {
						setLog( ( prev ) => [
							...prev.slice( -9 ),
							`open=${ nextOpen } reason=${ eventDetails.reason }`,
						] );
					} }
				>
					<Popover.Trigger>Toggle</Popover.Trigger>
					<Popover.Popup>
						<Popover.Arrow />
						<Popover.Title>Event Log</Popover.Title>
						<Popover.Description>
							Dismiss this popover via Escape, click-outside, or
							moving focus away.
						</Popover.Description>
					</Popover.Popup>
				</Popover.Root>

				<pre
					style={ {
						flex: 1,
						padding: 8,
						fontSize: 12,
						lineHeight: 1.5,
						background: '#f5f5f5',
						borderRadius: 4,
						minHeight: 100,
						margin: 0,
					} }
				>
					{ log.length
						? log.join( '\n' )
						: 'Interact with the popover to see events…' }
				</pre>
			</div>
		);
	},
};

/**
 * Pass a ref to `initialFocus` on `Popover.Popup` to focus a specific element
 * when the popover opens. This replaces the legacy Popover's `focusOnMount`
 * prop.
 *
 * In this example, the Email field receives focus instead of the first
 * focusable element (Name).
 */
export const InitialFocus: Story = {
	parameters: { controls: { disable: true } },
	render: function Render() {
		const emailRef = useRef< HTMLInputElement >( null );
		const nameId = useId();
		const emailId = useId();

		return (
			<Popover.Root>
				<Popover.Trigger>Open Form</Popover.Trigger>
				<Popover.Popup initialFocus={ emailRef }>
					<Popover.Arrow />
					<Popover.Title>Contact</Popover.Title>
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
						</label>
						<input
							id={ nameId }
							type="text"
							placeholder="Enter name"
						/>
						<label
							htmlFor={ emailId }
							style={ {
								display: 'flex',
								flexDirection: 'column',
								gap: 4,
								fontSize: 'inherit',
							} }
						>
							Email (auto-focused)
						</label>
						<input
							id={ emailId }
							ref={ emailRef }
							type="email"
							placeholder="Enter email"
						/>
					</form>
				</Popover.Popup>
			</Popover.Root>
		);
	},
};

/**
 * Set `modal="trap-focus"` on `Popover.Root` to trap keyboard focus inside the
 * popover without making it fully modal. Unlike `modal={true}`, this mode:
 *
 * - Traps Tab/Shift+Tab cycling within the popover
 * - Does **not** lock page scroll
 * - Does **not** block pointer interaction outside
 *
 * This replaces the legacy Popover's `constrainTabbing` prop. Try tabbing
 * through the fields — focus stays inside — then click the button outside
 * to verify that pointer interaction still works.
 */
export const TrapFocus: Story = {
	argTypes: { modal: { control: false } },
	args: {
		modal: 'trap-focus' as const,
	},
	render: function Render( args ) {
		return (
			<div style={ { display: 'flex', gap: '2rem' } }>
				<Popover.Root { ...args }>
					<Popover.Trigger>Open</Popover.Trigger>
					<Popover.Popup>
						<Popover.Arrow />
						<Popover.Title>Trap Focus</Popover.Title>
						<Popover.Description>
							Tab cycles within this popover, but clicking outside
							still works.
						</Popover.Description>
						<div
							style={ {
								display: 'flex',
								gap: 8,
								marginTop: 8,
							} }
						>
							<input placeholder="Field A" />
							<input placeholder="Field B" />
						</div>
					</Popover.Popup>
				</Popover.Root>

				<button
					type="button"
					onClick={ () =>
						// eslint-disable-next-line no-alert
						window.alert( 'Outside button clicked!' )
					}
				>
					Outside button
				</button>
			</div>
		);
	},
};

/**
 * Set `openOnHover` on `Popover.Root` to open the popover when the trigger is
 * hovered. The `delay` and `closeDelay` props control the timing (in ms).
 *
 * This is a capability the legacy Popover does not have natively — consumers
 * would need to wire up `mouseenter`/`mouseleave` handlers manually.
 */
export const HoverTrigger: Story = {
	argTypes: {
		openOnHover: { control: false },
	},
	args: {
		openOnHover: true,
		delay: 200,
		closeDelay: 150,
		children: (
			<>
				<Popover.Trigger>Hover me</Popover.Trigger>
				<Popover.Popup>
					<Popover.Arrow />
					<Popover.Title>Hover Popover</Popover.Title>
					<Popover.Description>
						This popover opens on hover with a 200ms delay and
						closes 150ms after the pointer leaves.
					</Popover.Description>
				</Popover.Popup>
			</>
		),
	},
};
