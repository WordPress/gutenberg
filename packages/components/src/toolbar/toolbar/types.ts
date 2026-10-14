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
	 * Leave undefined for the default style. `'unstyled'` removes the
	 * border and shadow from the toolbar.
	 *
	 * @default undefined
	 */
	variant?: 'unstyled' | undefined;
	/**
	 * Orientation of the toolbar keyboard interactions.
	 *
	 * @default 'horizontal'
	 */
	orientation?: 'horizontal' | 'vertical';
};
