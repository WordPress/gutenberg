/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { Spinner } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import type { ViewGridProps } from '../../../types';
import getDataByGroup from '../utils/get-data-by-group';
import useDisplayData from '../utils/use-display-data';
import CompositeGrid from './composite-grid';

function ViewGrid< Item >( {
	actions,
	data,
	fields,
	getItemId,
	isLoading,
	onChangeSelection,
	onClickItem,
	isItemClickable,
	renderItemLink,
	selection,
	view,
	className,
	empty,
}: ViewGridProps< Item > ) {
	const displayData = useDisplayData( data, isLoading );

	const hasData = !! displayData?.length;
	const groupField = view.groupBy?.field
		? fields.find( ( f ) => f.id === view.groupBy?.field )
		: null;
	const dataByGroup = groupField
		? getDataByGroup( displayData, groupField )
		: null;
	const isInfiniteScroll = view.infiniteScrollEnabled && ! dataByGroup;
	const noResults = ! hasData && ! isLoading;
	const showGrid = hasData || ( isLoading && isInfiniteScroll );
	const isRefreshing = ! isInfiniteScroll && isLoading && hasData;
	const gridProps = {
		className: clsx( className, { 'is-refreshing': isRefreshing } ),
		inert: isRefreshing ? 'true' : undefined,
		isLoading,
		view,
		fields,
		selection,
		onChangeSelection,
		onClickItem,
		isItemClickable,
		renderItemLink,
		getItemId,
		actions,
	};
	return (
		<>
			{
				// Render multiple groups.
				hasData && groupField && dataByGroup && (
					<Stack direction="column" gap="lg">
						{ Array.from( dataByGroup.entries() ).map(
							( [ groupName, groupItems ] ) => (
								<Stack
									direction="column"
									key={ groupName }
									gap="sm"
								>
									<h3 className="dataviews-view-grid__group-header">
										{ view.groupBy?.showLabel === false
											? groupName
											: sprintf(
													// translators: 1: The label of the field e.g. "Date". 2: The value of the field, e.g.: "May 2022".
													__( '%1$s: %2$s' ),
													groupField.label,
													groupName
											  ) }
									</h3>
									<CompositeGrid
										{ ...gridProps }
										data={ groupItems }
										isInfiniteScroll={ false }
									/>
								</Stack>
							)
						) }
					</Stack>
				)
			}
			{
				// Render a single grid with all data.
				showGrid && ! dataByGroup && (
					<CompositeGrid
						{ ...gridProps }
						data={ displayData }
						isInfiniteScroll={ !! isInfiniteScroll }
					/>
				)
			}
			{
				// Render empty state.
				noResults && (
					<div className="dataviews-no-results">{ empty }</div>
				)
			}
			{ isInfiniteScroll && isLoading && (
				<p className="dataviews-loading-more">
					<Spinner />
				</p>
			) }
		</>
	);
}

export default ViewGrid;
