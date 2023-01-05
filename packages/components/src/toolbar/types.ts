/**
 * External dependencies
 */
import type { ReactNode } from 'react';
import type { ToolbarProps as ReakitToolbarProps } from 'reakit/Toolbar';

export type ToolbarProps = {
	/**
	 * Class to set on the container div.
	 */
	className?: string;
	/**
	 * An accessible label for the toolbar.
	 */
	label: string;
	/**
	 * Children to render in the toolbar.
	 */
	children: ReactNode;
} & ReakitToolbarProps;

export type ToolbarContainerProps = ReakitToolbarProps &
	Pick< ToolbarProps, 'label' > & {
		className: string;
	};
