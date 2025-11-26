/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __experimentalVStack as VStack, Spinner } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { ViewGridProps } from '../../types';
import getDataByGroup from '../utils/get-data-by-group';
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
	const hasData = !! data?.length;
	const groupField = view.groupBy?.field
		? fields.find( ( f ) => f.id === view.groupBy?.field )
		: null;
	const dataByGroup = groupField ? getDataByGroup( data, groupField ) : null;
	const isInfiniteScroll = view.infiniteScrollEnabled && ! dataByGroup;
	const gridProps = {
		className,
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
					<VStack spacing={ 4 }>
						{ Array.from( dataByGroup.entries() ).map(
							( [ groupName, groupItems ] ) => (
								<VStack key={ groupName } spacing={ 2 }>
									<h3 className="dataviews-view-grid__group-header">
										{ sprintf(
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
								</VStack>
							)
						) }
					</VStack>
				)
			}
			{
				// Render a single grid with all data.
				hasData && ! dataByGroup && (
					<CompositeGrid
						{ ...gridProps }
						data={ data }
						isInfiniteScroll={ !! isInfiniteScroll }
					/>
				)
			}
			{
				// Render empty state.
				! hasData && (
					<div
						className={ clsx( {
							'dataviews-loading': isLoading,
							'dataviews-no-results': ! isLoading,
						} ) }
					>
						{ isLoading ? (
							<p>
								<Spinner />
							</p>
						) : (
							empty
						) }
					</div>
				)
			}
			{ hasData && isLoading && (
				<p className="dataviews-loading-more">
					<Spinner />
				</p>
			) }
		</>
	);
}

export default ViewGrid;
