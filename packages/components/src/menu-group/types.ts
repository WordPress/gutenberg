/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { ReactNode } from 'react';

export type MenuGroupProps = {
	/**
	 * Whether to hide top border on the MenuGroup container.
	 *
	 * @default false
	 */
	hideSeparator?: boolean;
	/**
	 * Text to be displayed as the menu group header.
	 */
	label?: string;
	/**
	 * An optional class name for the MenuGroup container.
	 *
	 * @default ''
	 */
	className?: string;
	/**
	 * Child elements.
	 */
	children: ReactNode;
};
