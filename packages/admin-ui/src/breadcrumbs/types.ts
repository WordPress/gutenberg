export interface BreadcrumbLinkItem {
	/**
	 * The label text for the breadcrumb item.
	 */
	label: string;

	/**
	 * The router path that the breadcrumb item should link to.
	 */
	to: string;
}

export interface BreadcrumbCurrentItem {
	/**
	 * The label text for the breadcrumb item.
	 */
	label: string;

	/**
	 * The router path that the breadcrumb item should link to.
	 * It is optional because the current item does not have a link.
	 */
	to?: string;
}

export type BreadcrumbItem = BreadcrumbLinkItem | BreadcrumbCurrentItem;

export interface BreadcrumbsProps extends React.HTMLAttributes< HTMLElement > {
	/**
	 * An array of items to display in the breadcrumb trail.
	 * The last item is considered the current item and has an optional `to` prop.
	 * All preceding items require a `to` prop.
	 */
	items: [] | [ ...BreadcrumbLinkItem[], BreadcrumbCurrentItem ];
	/**
	 * A boolean to show/hide the current item in the trail.
	 * Note that when `false` the current item is only visually hidden.
	 */
	showCurrentItem?: boolean;
}
