/**
 * External dependencies
 */
import type { ReactNode, MutableRefObject, SyntheticEvent } from 'react';
import type { Placement } from '@floating-ui/react-dom';

type PositionYAxis = 'top' | 'middle' | 'bottom';
type PositionXAxis = 'left' | 'center' | 'right';
type PositionCorner = 'top' | 'right' | 'bottom' | 'left';

type DomRectWithOwnerDocument = DOMRect & {
	ownerDocument?: Document;
};

type PopoverPlacement = Placement | 'overlay';

export type AnimatedWrapperProps = {
	placement: PopoverPlacement;
	shouldAnimate?: boolean;
};

export type PopoverAnchorRefReference = MutableRefObject<
	Element | null | undefined
>;
export type PopoverAnchorRefTopBottom = { top: Element; bottom: Element };

export type VirtualElement = Pick< Element, 'getBoundingClientRect' > & {
	ownerDocument?: Document;
};

export type PopoverProps = {
	/**
	 * The name of the Slot in which the popover should be rendered. It should
	 * be also passed to the corresponding `PopoverSlot` component.
	 *
	 * @default 'Popover'
	 */
	__unstableSlotName?: string;
	/**
	 * The element that should be used by the popover as its anchor. It can either
	 * be an `Element` or, alternatively, a `VirtualElement` — ie. an object with
	 * the `getBoundingClientRect()` and the `ownerDocument` properties defined.
	 *
	 * **The anchor element should be stored in local state** rather than a
	 * plain React ref to ensure reactive updating when it changes.
	 */
	anchor?: Element | VirtualElement | null;
	/**
	 * Whether the popover should animate when opening.
	 *
	 * @default true
	 */
	animate?: boolean;
	/**
	 * The `children` elements rendered as the popover's content.
	 */
	children: ReactNode;
	/**
	 * Show the popover fullscreen on mobile viewports.
	 */
	expandOnMobile?: boolean;
	/**
	 * Specifies whether the popover should flip across its axis if there isn't
	 * space for it in the normal placement.
	 * When the using a 'top' placement, the popover will switch to a 'bottom'
	 * placement. When using a 'left' placement, the popover will switch to a
	 * `right' placement.
	 * The popover will retain its alignment of 'start' or 'end' when flipping.
	 *
	 * @default true
	 */
	flip?: boolean;
	/**
	 * By default, the _first tabbable element_ in the popover will receive focus
	 * when it mounts. This is the same as setting this prop to `"firstElement"`.
	 * Specifying a `false` value disables the focus handling entirely (this
	 * should only be done when an appropriately accessible substitute behavior
	 * exists).
	 *
	 * @default 'firstElement'
	 */
	focusOnMount?: 'firstElement' | boolean;
	/**
	 * A callback invoked when the focus leaves the opened popover. This should
	 * only be provided in advanced use-cases when a popover should close under
	 * specific circumstances (for example, if the new `document.activeElement`
	 * is content of or otherwise controlling popover visibility).
	 *
	 * When not provided, the `onClose` callback will be called instead.
	 */
	onFocusOutside?: ( event: SyntheticEvent ) => void;
	/**
	 * Used to customize the header text shown when the popover is toggled to
	 * fullscreen on mobile viewports (see the `expandOnMobile` prop).
	 */
	headerTitle?: string;
	/**
	 * Used to show/hide the arrow that points at the popover's anchor.
	 *
	 * @default true
	 */
	noArrow?: boolean;
	/**
	 * The distance (in px) between the anchor and the popover.
	 */
	offset?: number;
	/**
	 * A callback invoked when the popover should be closed.
	 */
	onClose?: () => void;
	/**
	 * Used to specify the popover's position with respect to its anchor.
	 *
	 * @default 'bottom-start'
	 */
	placement?: PopoverPlacement;
	/**
	 * Legacy way to specify the popover's position with respect to its anchor.
	 * _Note: this prop is deprecated. Use the `placement` prop instead._
	 */
	position?:
		| `${ PositionYAxis }`
		| `${ PositionYAxis } ${ PositionXAxis }`
		| `${ PositionYAxis } ${ PositionXAxis } ${ PositionCorner }`;
	/**
	 * Adjusts the size of the popover to prevent its contents from going out of
	 * view when meeting the viewport edges.
	 *
	 * @default true
	 */
	resize?: boolean;
	/**
	 * Enables the `Popover` to shift in order to stay in view when meeting the
	 * viewport edges.
	 *
	 * @default false
	 */
	shift?: boolean;
	/**
	 * Specifies the popover's style.
	 *
	 * Leave undefined for the default style. Other values are:
	 * - 'unstyled':  The popover is essentially without any visible style, it
	 *                has no background, border, outline or drop shadow, but
	 *                the popover contents are still displayed.
	 * - 'toolbar':   A style that has no elevation, but a high contrast with
	 *                other elements. This is matches the style of the
	 *                `Toolbar` component.
	 *
	 * @default undefined
	 */
	variant?: 'unstyled' | 'toolbar';
	// Deprecated props
	/**
	 * Prevent the popover from flipping and resizing when meeting the viewport
	 * edges. _Note: this prop is deprecated. Instead, provide use the individual
	 * `flip` and `resize` props._
	 *
	 * @deprecated
	 */
	__unstableForcePosition?: boolean;
	/**
	 * An object extending a `DOMRect` with an additional optional `ownerDocument`
	 * property, used to specify a fixed popover position.
	 *
	 * @deprecated
	 */
	anchorRect?: DomRectWithOwnerDocument;
	/**
	 * Used to specify a fixed popover position. It can be an `Element`, a React
	 * reference to an `element`, an object with a `top` and a `bottom` properties
	 * (both pointing to elements), or a `range`.
	 *
	 * @deprecated
	 */
	anchorRef?:
		| Element
		| PopoverAnchorRefReference
		| PopoverAnchorRefTopBottom
		| Range;
	/**
	 * A function returning the same value as the one expected by the `anchorRect`
	 * prop, used to specify a dynamic popover position.
	 *
	 * @deprecated
	 */
	getAnchorRect?: (
		fallbackReferenceElement: Element | null
	) => DomRectWithOwnerDocument;
	/**
	 * Used to enable a different visual style for the popover.
	 * _Note: this prop is deprecated. Use the `variant` prop with the
	 * 'toolbar' value instead._
	 *
	 * @deprecated
	 */
	isAlternate?: boolean;
};
