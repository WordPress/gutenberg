import type { ReactNode } from 'react';
import type { Popover as _Popover } from '@base-ui/react/popover';
import type { ComponentProps } from '../utils/types';

export interface RootProps
	extends Pick<
		_Popover.Root.Props,
		| 'open'
		| 'onOpenChange'
		| 'defaultOpen'
		| 'modal'
		| 'openOnHover'
		| 'delay'
		| 'closeDelay'
	> {
	/**
	 * The content to be rendered inside the component.
	 */
	children?: ReactNode;
}

export interface TriggerProps extends ComponentProps< 'button' > {
	/**
	 * The content to be rendered inside the component.
	 */
	children?: ReactNode;
}

export interface PopupProps
	extends ComponentProps< 'div' >,
		Pick<
			_Popover.Positioner.Props,
			| 'align'
			| 'alignOffset'
			| 'anchor'
			| 'collisionAvoidance'
			| 'collisionBoundary'
			| 'collisionPadding'
			| 'side'
			| 'sideOffset'
			| 'sticky'
		>,
		Pick< _Popover.Popup.Props, 'initialFocus' | 'finalFocus' > {
	/**
	 * Whether the popup uses open/close animations.
	 *
	 * @default true
	 */
	animated?: boolean;

	/**
	 * The content to be rendered inside the component.
	 */
	children?: ReactNode;

	/**
	 * A parent element to render the portal into.
	 *
	 * Useful for cross-document rendering, such as rendering a popover
	 * in a parent document when the trigger is inside an iframe.
	 */
	container?: _Popover.Portal.Props[ 'container' ];

	/**
	 * Whether to render the popup inline without a portal.
	 *
	 * When `true`, the popup is rendered in place within the DOM hierarchy
	 * instead of being portaled to `document.body`.
	 *
	 * @default false
	 */
	inline?: boolean;

	/**
	 * The visual style variant of the popup.
	 *
	 * - `'default'` — standard surface styling with background, padding,
	 *    border radius, and shadow.
	 * - `'unstyled'` — no visual treatment; useful as a blank positioning
	 *    container for fully custom content.
	 *
	 * @default 'default'
	 */
	variant?: 'default' | 'unstyled';
}

export interface ArrowProps extends ComponentProps< 'div' > {
	/**
	 * Custom arrow visuals to render inside the positioned container.
	 */
	children?: ReactNode;
}

export interface TitleProps extends ComponentProps< 'h2' > {
	/**
	 * The title content to be rendered.
	 */
	children?: ReactNode;
}

export interface DescriptionProps extends ComponentProps< 'p' > {
	/**
	 * The description content to be rendered.
	 */
	children?: ReactNode;
}

export interface CloseProps extends ComponentProps< 'button' > {
	/**
	 * The content to be rendered inside the component.
	 */
	children?: ReactNode;
}
