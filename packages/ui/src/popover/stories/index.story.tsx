import type { Meta, StoryObj } from '@storybook/react-vite';
import { useId, useRef, useState } from '@wordpress/element';
import { SlotFillProvider, Slot } from '@wordpress/components';
import { close, info } from '@wordpress/icons';
import { Popover, VisuallyHidden } from '../..';
import { Icon } from '../../icon';
import { IconButton } from '../../icon-button';
import { GenericIframe, useMeasure } from './utils';

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
	argTypes: {
		children: { control: false },
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
					<Popover.Title
						style={ {
							marginBottom: 'var(--wpds-dimension-gap-xs)',
						} }
					>
						Popover title
					</Popover.Title>
					<Popover.Description>
						Popover description
					</Popover.Description>
				</Popover.Popup>
			</>
		),
	},
};

/**
 * A popover without the arrow sub-component. Omit `Popover.Arrow`
 * from the popup content when an arrow indicator is not desired.
 */
export const NoArrow: Story = {
	args: {
		children: (
			<>
				<Popover.Trigger>Open Popover</Popover.Trigger>
				<Popover.Popup>
					<Popover.Title
						style={ {
							marginBottom: 'var(--wpds-dimension-gap-xs)',
						} }
					>
						Popover title
					</Popover.Title>
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
								collisionAvoidance={ {
									side: 'none',
									align: 'none',
								} }
							>
								<VisuallyHidden render={ <Popover.Title /> }>
									{ side } / { align }
								</VisuallyHidden>
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
 * A popover with a close icon button, title, and description. The
 * `Popover.Close` component renders a button that closes the popover when
 * clicked. Here it wraps an `IconButton` for a properly sized, accessible
 * close action — matching the Dialog close-icon pattern.
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
							marginBottom: 'var(--wpds-dimension-gap-sm)',
						} }
					>
						<Popover.Title>Settings</Popover.Title>
						<Popover.Close
							render={
								<IconButton
									variant="minimal"
									size="compact"
									tone="neutral"
									icon={ close }
									label="Close"
								/>
							}
						/>
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
					<Popover.Title
						style={ {
							marginBottom: 'var(--wpds-dimension-gap-xs)',
						} }
					>
						Controlled Popover
					</Popover.Title>
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
 * **Note:** focus trapping requires a `Popover.Close` part inside the popup
 * so that screen readers always have an escape route. It can be visually
 * hidden if needed.
 *
 * Pass `backdrop` to `Popover.Popup` to display a semi-transparent overlay
 * beneath the popover, signalling that the page is blocked.
 */
export const Modal: Story = {
	argTypes: { modal: { control: false } },
	args: {
		modal: true,
		children: (
			<>
				<Popover.Trigger>Edit Settings</Popover.Trigger>
				<Popover.Popup backdrop>
					<Popover.Arrow />
					<Popover.Title
						style={ {
							marginBottom: 'var(--wpds-dimension-gap-xs)',
						} }
					>
						Settings
					</Popover.Title>
					<form
						style={ {
							display: 'flex',
							flexDirection: 'column',
							gap: 'var(--wpds-dimension-gap-sm)',
							marginTop: 'var(--wpds-dimension-gap-sm)',
						} }
						onSubmit={ ( e ) => e.preventDefault() }
					>
						<label
							htmlFor="popover-test-name-id"
							style={ {
								display: 'flex',
								flexDirection: 'column',
								gap: 'var(--wpds-dimension-gap-xs)',
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
								gap: 'var(--wpds-dimension-gap-xs)',
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
								gap: 'var(--wpds-dimension-gap-sm)',
								marginTop: 'var(--wpds-dimension-gap-xs)',
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
					<Popover.Title
						style={ {
							marginBottom: 'var(--wpds-dimension-gap-xs)',
						} }
					>
						Custom Styled
					</Popover.Title>
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
						<Popover.Title
							style={ {
								marginBottom: 'var(--wpds-dimension-gap-xs)',
							} }
						>
							Overlay
						</Popover.Title>
						<Popover.Description>
							This popover is centered over its trigger using a
							negative sideOffset.
							<br />
							The trigger is currently hidden under the popover.
							<br />
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
 * To render the popup inline (without a portal), create a local ref to a
 * `<span>` with `display: contents` and pass it as the `container` prop.
 * The popup will render inside the span rather than being portaled to
 * `document.body`, while retaining all positioning behavior.
 *
 * **Note:** `backdrop` will not cover the full viewport in this mode.
 */
export const Inline: Story = {
	parameters: { controls: { disable: true } },
	render: function Render() {
		const inlineContainerRef = useRef< HTMLSpanElement >( null );

		return (
			<div data-testid="inline-wrapper">
				<Popover.Root>
					<Popover.Trigger>Open Inline</Popover.Trigger>
					<span
						ref={ inlineContainerRef }
						style={ { display: 'contents' } }
					/>
					<Popover.Popup container={ inlineContainerRef }>
						<Popover.Arrow />
						<Popover.Title
							style={ {
								marginBottom: 'var(--wpds-dimension-gap-xs)',
							} }
						>
							Inline Popover
						</Popover.Title>
						<Popover.Description>
							This popup is rendered in place — no portal is used.
							Inspect the DOM to see it lives inside its parent.
						</Popover.Description>
					</Popover.Popup>
				</Popover.Root>
			</div>
		);
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
							<Popover.Title
								style={ {
									marginBottom:
										'var(--wpds-dimension-gap-xs)',
								} }
							>
								Flip
							</Popover.Title>
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
							<Popover.Title
								style={ {
									marginBottom:
										'var(--wpds-dimension-gap-xs)',
								} }
							>
								None
							</Popover.Title>
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
									<Popover.Title
										style={ {
											marginBottom:
												'var(--wpds-dimension-gap-xs)',
										} }
									>
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
									<Popover.Title
										style={ {
											marginBottom:
												'var(--wpds-dimension-gap-xs)',
										} }
									>
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
					<Popover.Title
						style={ {
							marginBottom: 'var(--wpds-dimension-gap-xs)',
						} }
					>
						Custom z-index
					</Popover.Title>
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
		const virtualAnchorLabel = useRef< HTMLDivElement >( null );
		const callbackTarget = useRef< HTMLDivElement >( null );

		const virtualAnchor = {
			getBoundingClientRect: () =>
				virtualAnchorLabel.current?.getBoundingClientRect() ??
				new DOMRect(),
		};

		const anchorBoxStyle = {
			padding: '8px 12px',
			border: '2px dashed currentcolor',
			borderRadius: 4,
			fontSize: 12,
			textAlign: 'center' as const,
		};

		const popupProps = {
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
							<VisuallyHidden render={ <Popover.Title /> }>
								Element anchor
							</VisuallyHidden>
							<Popover.Arrow />
							<Popover.Description>
								Anchored to a DOM element
							</Popover.Description>
						</Popover.Popup>
					</Popover.Root>
				</div>

				{ /* 2. VirtualElement anchor */ }
				<div>
					<div ref={ virtualAnchorLabel } style={ anchorBoxStyle }>
						VirtualElement anchor
					</div>
					<Popover.Root open>
						<Popover.Popup
							anchor={ virtualAnchor }
							{ ...popupProps }
						>
							<VisuallyHidden render={ <Popover.Title /> }>
								Virtual anchor
							</VisuallyHidden>
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
							<VisuallyHidden render={ <Popover.Title /> }>
								Ref anchor
							</VisuallyHidden>
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
							<VisuallyHidden render={ <Popover.Title /> }>
								Callback anchor
							</VisuallyHidden>
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
						gap: 'var(--wpds-dimension-gap-xs)',
						padding: '4px 8px',
						border: '1px solid #1e1e1e',
						borderRadius: 2,
						background: '#fff',
						fontSize: 13,
					} }
				>
					<VisuallyHidden render={ <Popover.Title /> }>
						Formatting
					</VisuallyHidden>
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
 * Base UI's Positioner exposes `--available-height` and
 * `--available-width` CSS variables representing the space
 * between the anchor and the viewport edge. Apply them as `max-height` /
 * `max-width` via the `style` prop (which targets the positioner) to
 * constrain the popup size. Then add `overflow: auto` on an inner wrapper
 * so scrolling happens inside the popup content area — this replaces the
 * legacy Popover's `resize` prop.
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
							maxHeight: 'var(--available-height, 300px)',
							maxWidth: 'var(--available-width, 300px)',
						} }
					>
						<div style={ { overflow: 'auto', height: '100%' } }>
							<Popover.Title
								style={ {
									marginBottom:
										'var(--wpds-dimension-gap-xs)',
								} }
							>
								Constrained
							</Popover.Title>
							<Popover.Description>
								This popup constrains its size using the
								`--available-height` and `--available-width` CSS
								variables exposed by the positioner.
							</Popover.Description>
							<div style={ { height: 400 } }>
								<p>
									Scroll inside this popup — its max-height is
									capped to the available viewport space.
								</p>
							</div>
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
						<Popover.Title
							style={ {
								marginBottom: 'var(--wpds-dimension-gap-xs)',
							} }
						>
							Event Log
						</Popover.Title>
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
					<Popover.Title
						style={ {
							marginBottom: 'var(--wpds-dimension-gap-xs)',
						} }
					>
						Contact
					</Popover.Title>
					<form
						style={ {
							display: 'flex',
							flexDirection: 'column',
							gap: 'var(--wpds-dimension-gap-sm)',
						} }
						onSubmit={ ( e ) => e.preventDefault() }
					>
						<label
							htmlFor={ nameId }
							style={ {
								display: 'flex',
								flexDirection: 'column',
								gap: 'var(--wpds-dimension-gap-xs)',
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
								gap: 'var(--wpds-dimension-gap-xs)',
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
 * A `Popover.Close` part must be rendered inside the popup so that screen
 * readers can escape. It can be visually hidden if not needed visually.
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
						<Popover.Title
							style={ {
								marginBottom: 'var(--wpds-dimension-gap-xs)',
							} }
						>
							Trap Focus
						</Popover.Title>
						<Popover.Description>
							Tab cycles within this popover, but clicking outside
							still works.
						</Popover.Description>
						<div
							style={ {
								display: 'flex',
								gap: 'var(--wpds-dimension-gap-sm)',
								marginTop: 'var(--wpds-dimension-gap-sm)',
							} }
						>
							<input placeholder="Field A" />
							<input placeholder="Field B" />
							<Popover.Close>Close</Popover.Close>
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
 * Set `openOnHover` on `Popover.Trigger` to open the popover when the trigger
 * is hovered. The `delay` and `closeDelay` props control the timing (in ms).
 *
 * This is a capability the legacy Popover does not have natively — consumers
 * would need to wire up `mouseenter`/`mouseleave` handlers manually.
 */
export const HoverTrigger: Story = {
	parameters: { controls: { disable: true } },
	render: function Render( args ) {
		return (
			<Popover.Root { ...args }>
				<Popover.Trigger openOnHover delay={ 200 } closeDelay={ 150 }>
					Hover me
				</Popover.Trigger>
				<Popover.Popup>
					<Popover.Arrow />
					<Popover.Title
						style={ {
							marginBottom: 'var(--wpds-dimension-gap-xs)',
						} }
					>
						Hover Popover
					</Popover.Title>
					<Popover.Description>
						This popover opens on hover with a 200ms delay and
						closes 150ms after the pointer leaves.
					</Popover.Description>
				</Popover.Popup>
			</Popover.Root>
		);
	},
};

/**
 * Popups that open when hovering an info icon should use Popover with the
 * `openOnHover` prop on the trigger instead of a tooltip. This way, touch
 * users and screen reader users can access the content.
 *
 * To know when to reach for a popover instead of a tooltip, consider the
 * purpose of the trigger element: If the trigger's purpose is to open the
 * popup itself, it's a popover. If the trigger's purpose is unrelated to
 * opening the popup, it's a tooltip.
 */
export const Infotip: Story = {
	parameters: { controls: { disable: true } },
	render: function Render( args ) {
		return (
			<div
				style={ {
					display: 'flex',
					alignItems: 'center',
					gap: 'var(--wpds-dimension-gap-xs)',
				} }
			>
				<span>Label</span>
				<Popover.Root { ...args }>
					<Popover.Trigger
						openOnHover
						delay={ 200 }
						closeDelay={ 200 }
						aria-label="More information"
						style={ {
							background: 'none',
							border: 'none',
							padding: 0,
							cursor: 'var(--wpds-cursor-control)',
							display: 'inline-flex',
							alignItems: 'center',
							borderRadius: 'var(--wpds-border-radius-sm)',
						} }
					>
						<Icon icon={ info } size={ 20 } />
					</Popover.Trigger>
					<Popover.Popup>
						<Popover.Arrow />
						<VisuallyHidden render={ <Popover.Title /> }>
							More information
						</VisuallyHidden>
						<Popover.Description>
							This is additional context about the label. Unlike
							tooltips, this content is accessible to touch and
							screen reader users.
						</Popover.Description>
					</Popover.Popup>
				</Popover.Root>
			</div>
		);
	},
};
