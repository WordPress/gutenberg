import type { ReactElement, ReactNode } from 'react';
import type { Tooltip as _Tooltip } from '@base-ui/react/tooltip';

import type { ComponentProps } from '../utils/types';

export type PortalProps = ComponentProps< typeof _Tooltip.Portal >;

export type PositionerProps = ComponentProps< typeof _Tooltip.Positioner >;

export type RootProps = Pick< _Tooltip.Root.Props, 'disabled' | 'children' >;

export type ProviderProps = _Tooltip.Provider.Props;

export interface TriggerProps extends ComponentProps< 'button' > {
	/**
	 * The content to be rendered inside the component.
	 */
	children?: ReactNode;
}

export interface PopupProps extends ComponentProps< 'div' > {
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

	/**
	 * Optional positioner element, typically `<Tooltip.Positioner />` with
	 * custom positioning props (`side`, `align`, `sideOffset`, collision
	 * settings, etc.). When omitted, `Tooltip.Popup` uses `Tooltip.Positioner`
	 * with default props. Do not pass `children` on the positioner element;
	 * they would be ignored.
	 */
	positioner?: ReactElement< Omit< PositionerProps, 'children' > >;
}
