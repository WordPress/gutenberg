import type { Dialog as _Dialog } from '@base-ui/react/dialog';
import type { ComponentPropsWithoutRef, ReactElement, ReactNode } from 'react';

import type { Button } from '../button';
import type { IconButton } from '../icon-button';
import type { ComponentProps } from '../utils/types';

export type PortalProps = ComponentPropsWithoutRef< typeof _Dialog.Portal >;

export interface RootProps
	extends Pick<
		_Dialog.Root.Props,
		| 'open'
		| 'onOpenChange'
		| 'onOpenChangeComplete'
		| 'defaultOpen'
		| 'modal'
		| 'disablePointerDismissal'
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
		Pick< _Dialog.Popup.Props, 'initialFocus' | 'finalFocus' > {
	/**
	 * The content to be rendered inside the component.
	 */
	children?: ReactNode;

	/**
	 * Optional portal element, typically `<Dialog.Portal />` with custom
	 * `container`, `className`, or `style`. The popup and backdrop are
	 * rendered as this portal's children (do not pass `children` on the portal
	 * element; they would be ignored).
	 *
	 * When omitted, `Dialog.Popup` uses `Dialog.Portal` with default props,
	 * rendering the portal in the current document's `<body>`.
	 */
	portal?: ReactElement< Omit< PortalProps, 'children' > >;

	/**
	 * Renders the dialog at a preset width (excluding additional padding from
	 * the viewport edges).
	 *
	 * Height is not directly controlled by `size`: for every value except
	 * `'full'`, the dialog fits its content up to the viewport height
	 * (minus the viewport inset) and scrolls internally when it overflows.
	 * `'full'` stretches the dialog to the available viewport height.
	 *
	 * - `'small'` — narrow max-width.
	 * - `'medium'` — moderate max-width.
	 * - `'large'` — wide max-width.
	 * - `'stretch'` — no max-width, stretches to fill available width.
	 * - `'full'` — stretches to fill available width and height.
	 *
	 * @default 'medium'
	 */
	size?: 'small' | 'medium' | 'large' | 'stretch' | 'full';
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

export interface ContentProps extends ComponentProps< 'div' > {
	/**
	 * The body content to be rendered inside the scroll container.
	 */
	children?: ReactNode;
	/**
	 * The scroll region automatically becomes a keyboard-reachable tab
	 * stop (`tabindex="0"`) whenever the body overflows, so keyboard
	 * users can arrow-scroll the region (WCAG 2.1.1). It becomes
	 * non-tabbable again as soon as the content no longer overflows.
	 *
	 * If you supply `tabIndex` explicitly, your value wins and is never
	 * overwritten — including `tabIndex={ -1 }` to opt out of the
	 * automatic tab stop entirely, and including overrides applied
	 * after the component had already managed the value.
	 *
	 * Two narrow edge cases:
	 * - If you later *remove* an explicit `tabIndex` at runtime, the
	 *   component will resume managing it on the next overflow tick; it
	 *   can't distinguish a previous explicit opt-out from an
	 *   unconfigured state.
	 * - Passing `tabIndex={ 0 }` while the body overflows produces a
	 *   value identical to the auto-managed one, so the component can
	 *   no longer tell the two apart and may strip it on the next
	 *   non-overflow tick. Pick a different value (or rely on the
	 *   default behavior, which is already `0` while overflowing).
	 *
	 * Note: the scroll region is intentionally rendered without
	 * `role` / `aria-label`, so screen readers don't announce a
	 * generic "scrollable" landmark on top of the dialog's existing
	 * heading + body; the surrounding `Dialog.Title` and body content
	 * provide the context.
	 */
	tabIndex?: number;
}

export interface TitleProps extends ComponentProps< 'h2' > {
	/**
	 * The title content to be rendered. This serves as both the visible
	 * heading and the accessible label for the dialog.
	 *
	 * When `Dialog.Title` is passed as a render element (e.g. to
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
