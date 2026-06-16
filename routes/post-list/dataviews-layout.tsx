/**
 * WordPress dependencies
 */
import { DataViews } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';

export function PostListDataViewsLayout() {
	return (
		<>
			<div className="routes-post-list__dataviews-toolbar">
				<div className="routes-post-list__dataviews-toolbar-start">
					<DataViews.Search label={ __( 'Search content' ) } />
					<DataViews.FiltersToggle />
				</div>
				<div className="routes-post-list__dataviews-toolbar-end">
					<DataViews.ViewConfig />
					<DataViews.LayoutSwitcher />
				</div>
			</div>
			<DataViews.FiltersToggled className="routes-post-list__dataviews-filters" />
			<div className="routes-post-list__dataviews-scroll">
				<DataViews.BulkActionToolbar />
				<DataViews.Layout />
				<DataViews.Pagination />
			</div>
		</>
	);
}
