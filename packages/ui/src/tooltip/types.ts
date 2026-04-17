import type { ReactElement, ReactNode } from 'react';
import type { Tooltip } from '@base-ui/react/tooltip';

import type { ComponentProps } from '../utils/types';
import type { PortalProps } from './portal';

export type RootProps = Pick< Tooltip.Root.Props, 'disabled' | 'children' >;

export type ProviderProps = Pick<
	Tooltip.Provider.Props,
	'delay' | 'children'
>;

export interface TriggerProps extends ComponentProps< 'button' > {
	/**
	 * The content to be rendered inside the component.
	 */
	children?: ReactNode;
}

export interface PopupProps
	extends ComponentProps< 'div' >,
		Pick< Tooltip.Positioner.Props, 'align' | 'side' | 'sideOffset' > {
	/**
	 * The content to be rendered inside the component.
	 */
	children?: ReactNode;

	/**
	 * Optional portal element, typically `<Tooltip.Portal />` with custom
	 * `container`. When omitted, `Tooltip.Popup` uses `Tooltip.Portal` with
	 * default props.
	 */
	portal?: ReactElement< PortalProps >;
}
