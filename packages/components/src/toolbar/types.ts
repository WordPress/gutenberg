/**
 * External dependencies
 */
import type { ReactNode } from 'react';
import type { ToolbarProps as ReakitToolbarProps } from 'reakit/Toolbar';

export type ToolbarProps = {
	/**
	 * Children to render in the toolbar.
	 */
	children?: ReactNode;
	/**
	 * Class to set on the container div.
	 */
	className?: string;
	/**
	 * An accessible label for the toolbar.
	 */
	label: string;
} & ReakitToolbarProps;

export type ToolbarContainerProps = ReakitToolbarProps &
	Pick< ToolbarProps, 'label' > & {
		className: string;
	};
