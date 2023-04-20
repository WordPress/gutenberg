/**
 * External dependencies
 */
import type { ReactNode } from 'react';

export type ToolbarProps = {
	/**
	 * Children to be rendered inside the toolbar.
	 */
	children?: ReactNode;
	/**
	 * An accessible label for the toolbar.
	 */
	label: string;
};
