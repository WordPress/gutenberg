/**
 * External dependencies
 */
import type { ReactNode } from 'react';

export type MenuGroupProps = {
	/**
	 * A CSS `class` to give to the container element.
	 */
	className?: string;
	/**
	 * Hide the top border on the container.
	 */
	hideSeparator?: boolean;
	/**
	 * Text to be displayed as the menu group header.
	 */
	label?: string;
	/**
	 * The children elements.
	 */
	children?: ReactNode;
};
