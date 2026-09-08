import type { ReactNode } from 'react';
import type { ComponentProps } from '../utils/types';

export interface RootProps extends Omit< ComponentProps< 'nav' >, 'children' > {
	/**
	 * `Breadcrumb.LinkItem` elements followed by one
	 * `Breadcrumb.CurrentItem`.
	 */
	children: ReactNode;
}

export interface LinkItemProps
	extends Omit<
		ComponentProps< 'a' >,
		'aria-current' | 'children' | 'href' | 'target'
	> {
	/**
	 * The complete browser-compatible destination for the ancestor page.
	 */
	href: string;

	/**
	 * Whether to open the link in a new browser tab.
	 * When true, sets `target="_blank"` and appends a visual arrow indicator.
	 *
	 * @default false
	 */
	openInNewTab?: boolean;

	/**
	 * The plain-text breadcrumb label.
	 */
	children: string;
}

export interface CurrentItemProps
	extends Omit<
		ComponentProps< 'span' >,
		'aria-current' | 'children' | 'tabIndex'
	> {
	/**
	 * The plain-text label for the current page.
	 */
	children: string;
}
