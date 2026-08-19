import type { ReactNode } from 'react';
import type { ComponentProps } from '../utils/types';

export interface RootProps extends Omit< ComponentProps< 'nav' >, 'children' > {
	/**
	 * `Breadcrumbs.LinkItem` elements followed by one
	 * `Breadcrumbs.CurrentItem`.
	 */
	children: ReactNode;
}

export interface LinkItemProps
	extends Omit<
		ComponentProps< 'a' >,
		'aria-current' | 'children' | 'href'
	> {
	/**
	 * The complete browser-compatible destination for the ancestor page.
	 */
	href: string;

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
