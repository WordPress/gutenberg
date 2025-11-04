/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __experimentalVStack as VStack, Spinner } from '@wordpress/components';

/**
 * Internal dependencies
 */
import type { ViewTimelineProps } from '../../types';
import getDataByGroup from '../utils/get-data-by-group';
import TimelineItem from './timeline-item';
import TimelineGroup from './timeline-group';
import { isDefined } from './utils';

export default function ViewTimeline< Item >(
	props: ViewTimelineProps< Item >
) {
	const {
		actions,
		data,
		fields,
		getItemId,
		isLoading,
		view,
		className,
		empty,
		onClickItem,
		renderItemLink,
		isItemClickable,
	} = props;

	// Determine which fields to display based on view configuration
	const titleField = fields.find( ( field ) => field.id === view.titleField );
	const mediaField = fields.find( ( field ) => field.id === view.mediaField );
	const descriptionField = fields.find(
		( field ) => field.id === view.descriptionField
	);
	const eventFieldId = view?.layout?.eventField ?? undefined;
	const eventField = eventFieldId
		? fields.find( ( field ) => field.id === eventFieldId )
		: undefined;
	const otherFields = ( view?.fields ?? [] )
		.map( ( fieldId ) => fields.find( ( f ) => fieldId === f.id ) )
		.filter( isDefined );

	// Handle empty/loading states
	const hasData = data?.length;
	if ( ! hasData ) {
		return (
			<div
				className={ clsx( {
					'dataviews-loading': isLoading,
					'dataviews-no-results': ! hasData && ! isLoading,
				} ) }
			>
				{ ! hasData &&
					( isLoading ? (
						<p>
							<Spinner />
						</p>
					) : (
						empty
					) ) }
			</div>
		);
	}

	// Check if data should be grouped
	const groupField = view.groupByField
		? fields.find( ( field ) => field.id === view.groupByField )
		: null;
	const dataByGroup = groupField ? getDataByGroup( data, groupField ) : null;

	// Convert dataByGroup entries into array and reverse order
	const groupedEntries = dataByGroup
		? Array.from( dataByGroup.entries() )
		: [];

	// Render grouped timeline
	if ( hasData && groupField && dataByGroup ) {
		return (
			<VStack
				spacing={ 2 }
				className={ clsx( 'dataviews-view-timeline', className ) }
			>
				{ groupedEntries.map( ( [ groupName, groupItems ] ) => (
					<TimelineGroup
						key={ groupName }
						groupName={ groupName }
						groupItems={ groupItems }
						view={ view }
						actions={ actions }
						getItemId={ getItemId }
						titleField={ titleField }
						mediaField={ mediaField }
						descriptionField={ descriptionField }
						eventField={ eventField }
						groupField={ groupField }
						otherFields={ otherFields }
						onClickItem={ onClickItem }
						renderItemLink={ renderItemLink }
						isItemClickable={ isItemClickable }
					/>
				) ) }
			</VStack>
		);
	}

	// Render flat timeline (no grouping)
	return (
		<>
			<div
				className={ clsx( 'dataviews-view-timeline', className ) }
				role={ view.infiniteScrollEnabled ? 'feed' : undefined }
			>
				{ data.map( ( item, index ) => {
					const id = getItemId( item );
					return (
						<TimelineItem
							key={ id }
							view={ view }
							actions={ actions }
							item={ item }
							mediaField={ mediaField }
							titleField={ titleField }
							descriptionField={ descriptionField }
							eventField={ eventField }
							otherFields={ otherFields }
							onClickItem={ onClickItem }
							renderItemLink={ renderItemLink }
							isItemClickable={ isItemClickable }
							posinset={
								view.infiniteScrollEnabled
									? index + 1
									: undefined
							}
						/>
					);
				} ) }
			</div>
			{ hasData && isLoading && (
				<p className="dataviews-loading-more">
					<Spinner />
				</p>
			) }
		</>
	);
}
