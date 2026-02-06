import type { Dialog as _Dialog } from '@base-ui/react/dialog';
import type { ReactNode } from 'react';
import type { Button } from '../button';
import type { IconButton } from '../icon-button';
import type { ComponentProps } from '../utils/types';

export interface RootProps
	extends Pick<
		_Dialog.Root.Props,
		'open' | 'onOpenChange' | 'defaultOpen' | 'modal'
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

export interface PopupProps extends ComponentProps< 'div' > {
	/**
	 * The content to be rendered inside the component.
	 */
	children?: ReactNode;

	/**
	 * Renders the dialog at a preset width.
	 *
	 * - `'small'` — max-width of 384px.
	 * - `'medium'` — max-width of 512px.
	 * - `'large'` — max-width of 840px.
	 * - `'stretch'` — no max-width, stretches to fill available space.
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

export interface FooterProps extends ComponentProps< 'div' > {
	/**
	 * The content to be rendered inside the component.
	 */
	children?: ReactNode;
}

export interface HeaderProps extends ComponentProps< 'div' > {
	/**
	 * The content to be rendered inside the component.
	 */
	children?: ReactNode;
}

export interface TitleProps extends ComponentProps< 'h2' > {
	/**
	 * The title content to be rendered. This serves as both the visible
	 * heading and the accessible label for the dialog.
	 */
	children: ReactNode;
}

export interface CloseIconProps
	extends Omit<
		ComponentProps< typeof IconButton >,
		'label' | 'icon' | 'loading' | 'loadingAnnouncement'
	> {
	/**
	 * A label describing the button's action, shown as a tooltip and to
	 * assistive technology.
	 */
	label?: ComponentProps< typeof IconButton >[ 'label' ];

	/**
	 * The icon to display in the button.
	 */
	icon?: ComponentProps< typeof IconButton >[ 'icon' ];
}
