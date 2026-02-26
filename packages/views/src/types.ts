/**
 * WordPress dependencies
 */
import type { View, Filter, SupportedLayouts } from '@wordpress/dataviews';

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
	 * Default view configuration
	 */
	defaultView: View;

	/**
	 * View overrides applied on top of the persisted view but never persisted.
	 * These represent tab-specific configuration (filters, sort) that should
	 * override the persisted view settings.
	 */
	activeViewOverrides?: {
		filters?: Filter[];
		sort?: View[ 'sort' ];
		layout?: Record< string, unknown >;
	};

	/**
	 * Per-layout-type default configuration (e.g. table column styles).
	 * The layout property for the current view type is treated as an
	 * active view override: merged on read, stripped before persisting.
	 */
	defaultLayouts?: SupportedLayouts;

	/**
	 * Optional query parameters from URL (page, search)
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
