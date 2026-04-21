import type { ComponentPropsWithoutRef, ReactElement, ReactNode } from 'react';
import type { Popover as _Popover } from '@base-ui/react/popover';

import type { ComponentProps } from '../utils/types';

export type PortalProps = ComponentPropsWithoutRef< typeof _Popover.Portal >;

export interface RootProps
	extends Pick<
		_Popover.Root.Props,
		'open' | 'onOpenChange' | 'defaultOpen' | 'modal'
	> {
	/**
	 * The popover sub-components (`Popover.Trigger`, `Popover.Popup`, etc.).
	 */
	children?: ReactNode;
}

export interface TriggerProps
	extends ComponentProps< 'button' >,
		Pick< _Popover.Trigger.Props, 'openOnHover' | 'delay' | 'closeDelay' > {
	/**
	 * The content to be rendered inside the component.
	 */
	children?: ReactNode;
}

/**
 * `Popover.Popup` maps to two Base UI elements internally: the
 * **Positioner** (outer, handles fixed positioning and z-index) and the
 * **Popup** (inner, holds content and visual styles).
 *
 * `style` and `className` are forwarded to the **Positioner** so that
 * z-index overrides (`--wp-ui-popover-z-index`) and Base UI CSS variables
 * (`--available-height`, `--available-width`) work correctly. All other
 * HTML attributes are forwarded to the inner **Popup** element.
 */
export interface PopupProps
	extends ComponentProps< 'div' >,
		Pick<
			_Popover.Positioner.Props,
			| 'align'
			| 'alignOffset'
			| 'anchor'
			| 'arrowPadding'
			| 'collisionAvoidance'
			| 'collisionBoundary'
			| 'collisionPadding'
			| 'side'
			| 'sideOffset'
			| 'sticky'
		>,
		Pick< _Popover.Popup.Props, 'initialFocus' | 'finalFocus' > {
	/**
	 * Whether to render a backdrop overlay behind the popover.
	 *
	 * Typically used with `modal` to signal that interaction with the rest
	 * of the page is blocked. The backdrop is a semi-transparent dark overlay.
	 *
	 * @default false
	 */
	backdrop?: boolean;

	/**
	 * The content to be rendered inside the component.
	 */
	children?: ReactNode;

	/**
	 * Optional portal element, typically `<Popover.Portal />` with custom
	 * `container` for cross-document rendering. Floating content is rendered
	 * as this portal's children (do not pass `children` on the portal element;
	 * they would be ignored).
	 *
	 * When omitted, `Popover.Popup` uses `Popover.Portal` with default props.
	 */
	portal?: ReactElement< Omit< PortalProps, 'children' > >;

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
