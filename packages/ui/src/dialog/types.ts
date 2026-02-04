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
	 * The title text for the dialog. This is required to be a string to ensure
	 * accessible labeling of the dialog.
	 */
	title: string;

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
	 */
	size?: 'small' | 'medium' | 'large' | 'full';
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

export type HeadingProps = ComponentProps< 'div' >;

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
