import type { ReactNode } from 'react';
import type { Popover as _Popover } from '@base-ui/react/popover';
import type { ComponentProps } from '../utils/types';

export interface RootProps
	extends Pick<
		_Popover.Root.Props,
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

export interface PopupProps
	extends ComponentProps< 'div' >,
		Pick<
			_Popover.Positioner.Props,
			'align' | 'side' | 'sideOffset' | 'alignOffset'
		> {
	/**
	 * The content to be rendered inside the component.
	 */
	children?: ReactNode;
}

export interface ArrowProps extends ComponentProps< 'div' > {}

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
