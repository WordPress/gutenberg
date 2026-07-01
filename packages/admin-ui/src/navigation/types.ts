export interface NavigationItem {
	/**
	 * The label text for the navigation item.
	 */
	label: string;

	/**
	 * The router path to link to. Optional when linking within the current
	 * route via `search`.
	 */
	to?: string;

	/**
	 * Query params to merge into the link. The current params are preserved
	 * and these are applied on top.
	 */
	search?: Record< string, unknown >;

	/**
	 * Whether this item points to the current location. It's rendered with
	 * `aria-current="page"` and a distinct visual treatment.
	 */
	active?: boolean;
}

export interface NavigationProps extends React.HTMLAttributes< HTMLElement > {
	/**
	 * An array of items to display as navigation links. Every item links via
	 * `to` and/or `search`; mark the current one with `active`.
	 */
	items: NavigationItem[];
}
