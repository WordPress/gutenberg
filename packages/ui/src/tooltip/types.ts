import type { ReactNode } from 'react';
import type { Tooltip } from '@base-ui/react/tooltip';
import type { ComponentProps } from '../utils/types';

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
}
