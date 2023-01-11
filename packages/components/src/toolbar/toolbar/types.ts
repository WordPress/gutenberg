/**
 * External dependencies
 */
import type { ToolbarProps as ReakitToolbarContainerProps } from 'reakit/Toolbar';

export type ToolbarProps = {
	/**
	 * An accessible label for the toolbar.
	 */
	label?: string;
	/**
	 * Class to set on the container div.
	 */
	className?: string;
} & Partial< ReakitToolbarContainerProps >;

export type ToolbarContainerProps = {
	label: ToolbarProps[ 'label' ];
} & Partial< ReakitToolbarContainerProps >;
