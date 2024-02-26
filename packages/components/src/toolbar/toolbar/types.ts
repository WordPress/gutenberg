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
	/**
	 * Specifies the toolbar's style.
	 *
	 * Leave undefined for the default style. Or `'unstyled'` which
	 * removes the border from the toolbar, but keeps the default
	 * popover style.
	 *
	 * @default undefined
	 */
	variant?: 'unstyled' | undefined;
};
