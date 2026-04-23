import type { Drawer as _Drawer } from '@base-ui/react/drawer';
import type { ComponentPropsWithoutRef, ReactElement, ReactNode } from 'react';
import type { Button } from '../button';
import type { IconButton } from '../icon-button';
import type { ComponentProps } from '../utils/types';

export type PortalProps = ComponentPropsWithoutRef< typeof _Drawer.Portal >;

export interface RootProps
	extends Pick<
		_Drawer.Root.Props,
		| 'open'
		| 'onOpenChange'
		| 'onOpenChangeComplete'
		| 'defaultOpen'
		| 'modal'
		| 'disablePointerDismissal'
	> {
	/**
	 * The edge the drawer slides in from, and the direction used to dismiss it
	 * via swipe gesture.
	 *
	 * - `'left'` / `'right'`: side drawers; swipe horizontally to dismiss.
	 * - `'down'`: bottom sheet; swipe down to dismiss.
	 * - `'up'`: top drawer; swipe up to dismiss.
	 *
	 * @default 'left'
	 */
	swipeDirection?: _Drawer.Root.Props[ 'swipeDirection' ];

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
		Pick< _Drawer.Popup.Props, 'initialFocus' | 'finalFocus' > {
	/**
	 * The content to be rendered inside the component.
	 */
	children?: ReactNode;

	/**
	 * Optional portal element, typically `<Drawer.Portal />` with custom
	 * `container`, `className`, or `style`. The backdrop and inner viewport
	 * are rendered as this portal's children (do not pass `children` on the
	 * portal element; they would be ignored).
	 *
	 * When omitted, `Drawer.Popup` uses `Drawer.Portal` with default props,
	 * rendering the portal in the current document's `<body>`.
	 */
	portal?: ReactElement< Omit< PortalProps, 'children' > >;

	/**
	 * Controls the size of the drawer along its relevant axis (width for
	 * left/right drawers, height for up/down drawers).
	 *
	 * When not specified, left/right drawers use a default medium width
	 * and up/down drawers fit their content.
	 *
	 * - `'small'` — narrow/short.
	 * - `'medium'` — moderate.
	 * - `'large'` — wide/tall.
	 * - `'stretch'` — fills available space, respecting the viewport inset.
	 * - `'auto'` — fit content along the relevant axis.
	 *
	 * @default 'medium' for left/right drawers, 'auto' for up/down drawers
	 */
	size?: 'small' | 'medium' | 'large' | 'stretch' | 'auto';
}

export interface ActionProps extends ComponentProps< typeof Button > {
	/**
	 * The content to be rendered inside the component.
	 */
	children?: ReactNode;
}

export interface FooterProps extends ComponentProps< 'footer' > {
	/**
	 * The content to be rendered inside the component.
	 */
	children?: ReactNode;
}

export interface HeaderProps extends ComponentProps< 'header' > {
	/**
	 * The content to be rendered inside the component.
	 */
	children?: ReactNode;
}

export interface TitleProps extends ComponentProps< 'h2' > {
	/**
	 * The title content to be rendered. This serves as both the visible
	 * heading and the accessible label for the drawer.
	 *
	 * When `Drawer.Title` is passed as a render element (e.g. to
	 * `VisuallyHidden`), children can be provided by the wrapper instead.
	 */
	children?: ReactNode;
}

export interface DescriptionProps extends ComponentProps< 'p' > {
	/**
	 * The description content to be rendered inside the component.
	 */
	children?: ReactNode;
}

export interface CloseIconProps
	extends Omit<
		ComponentProps< typeof IconButton >,
		'label' | 'icon' | 'loading' | 'loadingAnnouncement'
	> {
	/**
	 * A label describing the button's action, shown as a tooltip and to
	 * assistive technology.
	 *
	 * @default __( 'Close' )
	 */
	label?: ComponentProps< typeof IconButton >[ 'label' ];
	/**
	 * The icon to display in the button.
	 *
	 * @default the `close` icon from `@wordpress/icons`
	 */
	icon?: ComponentProps< typeof IconButton >[ 'icon' ];
}
