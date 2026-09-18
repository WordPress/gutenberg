import { type ComponentType } from 'react';
import type { NavigationLinkProps } from '../navigation/types';

export interface PageBreadcrumbItem {
	/**
	 * The label text for the breadcrumb item.
	 */
	label: string;

	/**
	 * The destination for the breadcrumb item.
	 * It is optional for the last item (the current page).
	 * All preceding items must provide an `href`.
	 */
	href?: string;
}

export interface PageComponents {
	/**
	 * Component rendered in place of the default `<a>` for link-based UI in
	 * the page header (e.g. section navigation), such as a client-side router
	 * link. It receives standard anchor attributes (`href`, `aria-current`,
	 * `className`, `children`) and must forward them to the element it renders.
	 *
	 * @default 'a'
	 */
	link?: ComponentType< NavigationLinkProps >;
}
