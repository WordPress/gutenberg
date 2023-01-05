/**
 * External dependencies
 */
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
} & ReakitToolbarProps;

export type ToolbarContainerProps = ReakitToolbarProps &
	Pick< ToolbarProps, 'label' > & {
		className: string;
	};
