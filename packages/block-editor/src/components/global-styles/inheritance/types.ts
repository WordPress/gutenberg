import type { ComponentProps, ReactNode } from 'react';
import type { __experimentalToolsPanelItem as ToolsPanelItem } from '@wordpress/components';

export type InheritanceToolsPanelItemProps = Omit<
	ComponentProps< typeof ToolsPanelItem >,
	'className' | 'onDeselect' | 'children'
> & {
	/**
	 * Item className.
	 */
	className?: string;
	/**
	 * The control holds an inherited Global Styles value, whether or not a local value overrides it.
	 */
	isInherited?: boolean;
	/**
	 * Reset handler.
	 */
	onDeselect?: () => void;
	/**
	 * The control.
	 */
	children?: ReactNode;
};
