import { type ComponentType } from 'react';
import type { NavigationLinkProps } from '../navigation/types';

export interface BreadcrumbItem {
	/**
	 * The label text for the breadcrumb item.
	 */
	label: string;

	/**
	 * The URL the item links to. All items except the last one must have it.
	 * The last item is the current page, so it does not link.
	 */
	href?: string;
}

export interface BreadcrumbsProps {
	/**
	 * The breadcrumb items to display. The last item is the page heading.
	 */
	items: readonly BreadcrumbItem[];

	/**
	 * The heading level of the last item.
	 */
	headingLevel: 1 | 2 | 3 | 4 | 5 | 6;

	/**
	 * Component rendered in place of the default `<a>` for each link.
	 *
	 * @default 'a'
	 */
	linkComponent?: ComponentType< NavigationLinkProps >;
}
