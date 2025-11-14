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
import TimelineGroup from './timeline-group';
import TimelineItems from './timeline-items';

export default function ViewTimeline< Item >(
	props: ViewTimelineProps< Item >
) {
	const { empty, data, fields, isLoading, view, className } = props;

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

	const wrapperClassName = clsx( 'dataviews-view-timeline', className );

	// Check if data should be grouped
	const groupFieldId = view.groupBy?.field || view.groupByField;
	const groupField = groupFieldId
		? fields.find( ( field ) => field.id === groupFieldId )
		: null;
	const dataByGroup = groupField ? getDataByGroup( data, groupField ) : null;

	// Convert dataByGroup entries into array.
	const groupedEntries = dataByGroup
		? Array.from( dataByGroup.entries() )
		: [];

	// Render grouped timeline
	if ( hasData && groupField && dataByGroup ) {
		return (
			<VStack spacing={ 2 } className={ wrapperClassName }>
				{ groupedEntries.map(
					( [ groupName, groupData ]: [ string, Item[] ] ) => (
						<TimelineGroup< Item >
							key={ groupName }
							groupName={ groupName }
							groupData={ groupData }
							view={ view }
							groupField={ groupField }
						>
							<TimelineItems< Item >
								{ ...props }
								data={ groupData }
							/>
						</TimelineGroup>
					)
				) }
			</VStack>
		);
	}

	// Render flat timeline (no grouping)
	return (
		<>
			<div
				className={ wrapperClassName }
				role={ view.infiniteScrollEnabled ? 'feed' : undefined }
			>
				<TimelineItems< Item > { ...props } />
			</div>
			{ hasData && isLoading && (
				<p className="dataviews-loading-more">
					<Spinner />
				</p>
			) }
		</>
	);
}
