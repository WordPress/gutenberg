/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';
import { Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import DataViewsContext from '../dataviews-context';
import DataViewsPagination from '../dataviews-pagination';
import {
	BulkActionsFooter,
	useSomeItemHasAPossibleBulkAction,
} from '../dataviews-bulk-actions';
import { LAYOUT_GRID, LAYOUT_TABLE } from '../../constants';
import { useDelayedLoading } from '../../hooks/use-delayed-loading';

const EMPTY_ARRAY: [] = [];

export default function DataViewsFooter() {
	const {
		view,
		paginationInfo: { totalItems = 0, totalPages },
		data,
		actions = EMPTY_ARRAY,
		isLoading,
		hasInitiallyLoaded,
		hasInfiniteScrollHandler,
	} = useContext( DataViewsContext );

	const isRefreshing =
		!! isLoading &&
		hasInitiallyLoaded &&
		! hasInfiniteScrollHandler &&
		!! data?.length;

	const isDelayedRefreshing = useDelayedLoading( !! isRefreshing );

	const hasBulkActions =
		useSomeItemHasAPossibleBulkAction( actions, data ) &&
		[ LAYOUT_TABLE, LAYOUT_GRID ].includes( view.type );

	if (
		! isRefreshing &&
		( ! totalItems ||
			! totalPages ||
			( totalPages <= 1 && ! hasBulkActions ) )
	) {
		return null;
	}
	return (
		( !! totalItems || isRefreshing ) && (
			<div
				className="dataviews-footer"
				// @ts-ignore
				inert={ isRefreshing ? 'true' : undefined }
			>
				<Stack
					direction="row"
					justify="end"
					align="center"
					className={ clsx( 'dataviews-footer__content', {
						'is-refreshing': isDelayedRefreshing,
					} ) }
					gap="sm"
				>
					{ hasBulkActions && <BulkActionsFooter /> }
					<DataViewsPagination />
				</Stack>
			</div>
		)
	);
}
