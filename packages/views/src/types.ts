/**
 * WordPress dependencies
 */
import type { View } from '@wordpress/dataviews';

export type ActiveViewOverrides = {
	// scalar values
	titleField?: View[ 'titleField' ];
	showTitle?: View[ 'showTitle' ];
	mediaField?: View[ 'mediaField' ];
	showMedia?: View[ 'showMedia' ];
	descriptionField?: View[ 'descriptionField' ];
	showDescription?: View[ 'showDescription' ];
	showLevels?: View[ 'showLevels' ];
	infiniteScrollEnabled?: View[ 'infiniteScrollEnabled' ];
	// array & object values
	filters?: View[ 'filters' ];
	sort?: View[ 'sort' ];
	groupBy?: View[ 'groupBy' ];
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
	 * Default view configuration
	 */
	defaultView: View;

	/**
	 * View overrides applied on top of the persisted view but never persisted.
	 * These represent tab-specific configuration (filters, sort) and
	 * developer-defined view defaults that should override the persisted
	 * view settings.
	 */
	activeViewOverrides?: ActiveViewOverrides;

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
