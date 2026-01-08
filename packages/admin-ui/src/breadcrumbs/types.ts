export interface BreadcrumbItem {
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

export interface BreadcrumbsProps extends React.HTMLAttributes< HTMLElement > {
	/**
	 * An array of items to display in the breadcrumb trail.
	 * The last item is considered the current item.
	 */
	items: BreadcrumbItem[];
	/**
	 * A boolean to show/hide the current item in the trail.
	 * Note that when `false` the current item is only visually hidden.
	 */
	showCurrentItem?: boolean;
}
