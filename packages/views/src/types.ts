import type { View, SupportedLayouts } from '@wordpress/dataviews';

/**
 * A layer merged on top of a view: the active view overrides, and the user's
 * persisted modifications.
 *
 * It is derived from `View` so it stays in sync with it, but every property is
 * optional — including `type`, which `View` requires as the discriminant of its
 * layout union. A layer only ever carries the subset of properties it means to
 * override, and `layout` is loosened to a plain record because a `type`
 * override may change which layout shape applies.
 */
export type ViewOverrides = Partial< Omit< View, 'type' | 'layout' > > & {
	type?: View[ 'type' ];
	layout?: Record< string, unknown >;
};

export interface ViewConfig {
	/**
	 * Entity kind (e.g. postType, root).
	 * Similar to core-data entity kinds.
	 */
	kind: string;

	/**
	 * Entity name (e.g. post, page, user, site).
	 * Similar to core-data entity names.
	 */
	name: string;

	/**
	 * Identifier for the current view (all, published, mine, etc.)
	 */
	slug: string;

	/**
	 * Default view configuration.
	 */
	defaultView: View;

	/**
	 * View overrides applied on top of the default view and the default
	 * layouts, but never persisted. These represent tab-specific configuration
	 * (filters, sort) and developer-defined view defaults. The properties the
	 * user modified take precedence over them; the ones they never touched
	 * resolve out of them.
	 */
	activeViewOverrides?: ViewOverrides;

	/**
	 * Default layout configurations keyed by layout type.
	 * Used to apply layout-type-specific defaults (e.g., table column styles)
	 * that are merged as overrides based on the resolved view type.
	 */
	defaultLayouts?: SupportedLayouts;

	/**
	 * Optional query parameters from URL (page, search).
	 */
	queryParams?: {
		page?: number;
		search?: string;
	};

	/**
	 * Callback for when URL query parameters should change
	 */
	onChangeQueryParams?: ( params: {
		page?: number;
		search?: string;
	} ) => void;
}
