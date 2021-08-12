/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { ReactNode } from 'react';

export type Props = {
	/**
	 * Element to render as child of button.
	 */
	children?: ReactNode;
	/**
	 * Optional classname string to add to wrapper div
	 */
	className?: string;
	/**
	 * Optional label to display.
	 */
	label?: string;
	/**
	 * Whether or not to show a separator between items.
	 */
	hideSeparator?: boolean;
};
