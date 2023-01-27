/**
 * External dependencies
 */
import type { ToolbarProps as ReakitToolbarContainerProps } from 'reakit/Toolbar';

export type ToolbarProps = {
	/**
	 * Class to set on the container div.
	 */
	className?: string;
	/**
	 * An accessible label for the toolbar.
	 */
	label: string;
} & Partial< ReakitToolbarContainerProps >;
