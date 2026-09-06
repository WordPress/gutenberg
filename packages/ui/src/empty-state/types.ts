import type { ReactNode } from 'react';
import type { ComponentProps } from '../utils/types';
import type { IconProps } from '../icon/types';

export interface EmptyStateRootProps extends ComponentProps< 'div' > {
	/**
	 * The content to be rendered inside the component.
	 */
	children?: ReactNode;
}

export interface EmptyStateVisualProps extends ComponentProps< 'div' > {
	/**
	 * The visual content of the empty state (e.g., icon, illustration).
	 */
	children?: ReactNode;
}

export interface EmptyStateIconProps extends ComponentProps< 'div' > {
	/**
	 * The icon to render.
	 */
	icon: IconProps[ 'icon' ];
}

export interface EmptyStateTitleProps extends ComponentProps< 'h2' > {
	/**
	 * The title text of the empty state.
	 */
	children?: ReactNode;
}

export interface EmptyStateDescriptionProps extends ComponentProps< 'p' > {
	/**
	 * The description text of the empty state.
	 */
	children?: ReactNode;
}

export interface EmptyStateActionsProps extends ComponentProps< 'div' > {
	/**
	 * The action buttons for the empty state.
	 */
	children?: ReactNode;
}
