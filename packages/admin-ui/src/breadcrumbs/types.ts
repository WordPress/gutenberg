export interface BreadcrumbItem {
	/**
	 * The label text for the breadcrumb item.
	 */
	label: string;

	/**
	 * The router path that the breadcrumb item should link to.
	 * It is optional for the last item (the current page).
	 * All preceding items should provide a `to` prop.
	 */
	to?: string;
}

export interface BreadcrumbsProps extends React.HTMLAttributes< HTMLElement > {
	/**
	 * An array of items to display in the breadcrumb trail.
	 * The last item is considered the current item and has an optional `to` prop.
	 * All preceding items must have a `to` prop — in development mode,
	 * an error is thrown when this requirement is not met.
	 */
	items: BreadcrumbItem[];
	/**
	 * A boolean to show/hide the current item in the trail.
	 * Note that when `false` the current item is only visually hidden.
	 */
	showCurrentItem?: boolean;
}
