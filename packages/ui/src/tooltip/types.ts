import type { ComponentPropsWithoutRef, ReactElement, ReactNode } from 'react';
import type { Tooltip as _Tooltip } from '@base-ui/react/tooltip';

import type { ComponentProps } from '../utils/types';

export type PortalProps = ComponentPropsWithoutRef< typeof _Tooltip.Portal >;

export type RootProps = Pick< _Tooltip.Root.Props, 'disabled' | 'children' >;

export type ProviderProps = Pick<
	_Tooltip.Provider.Props,
	'delay' | 'children'
>;

export interface TriggerProps extends ComponentProps< 'button' > {
	/**
	 * The content to be rendered inside the component.
	 */
	children?: ReactNode;
}

/**
 * `Tooltip.Popup` maps to two Base UI elements internally: the
 * **Positioner** (outer, handles fixed positioning and z-index) and the
 * **Popup** (inner, holds content and visual styles).
 *
 * `style`, `className`, and all other HTML attributes are forwarded to the
 * inner **Popup** element.
 *
 * To override the z-index, use the `--wp-ui-tooltip-z-index` CSS variable
 * via `Tooltip.Portal` (per-instance) or globally on a wrapping element.
 */
export interface PopupProps
	extends ComponentProps< 'div' >,
		Pick< _Tooltip.Positioner.Props, 'align' | 'side' | 'sideOffset' > {
	/**
	 * The content to be rendered inside the component.
	 */
	children?: ReactNode;

	/**
	 * Optional portal element, typically `<Tooltip.Portal />` with custom
	 * `container`. When omitted, `Tooltip.Popup` uses `Tooltip.Portal` with
	 * default props. Do not pass `children` on the portal element; they would
	 * be ignored.
	 */
	portal?: ReactElement< Omit< PortalProps, 'children' > >;
}
