/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { Spinner } from '@wordpress/components';
import { Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import type { ViewActivityProps } from '../../../types';
import getDataByGroup from '../utils/get-data-by-group';
import ActivityGroup from './activity-group';
import ActivityItems from './activity-items';
import { useDelayedLoading } from '../../../hooks/use-delayed-loading';

export default function ViewActivity< Item >(
	props: ViewActivityProps< Item >
) {
	const { empty, data, fields, isLoading, view, className } = props;

	const isDelayedLoading = useDelayedLoading( !! isLoading );
	const hasData = !! data?.length;

	// Check if data should be grouped
	const groupField = view.groupBy?.field
		? fields.find( ( field ) => field.id === view.groupBy?.field )
		: null;
	const dataByGroup =
		hasData && groupField ? getDataByGroup( data, groupField ) : null;

	const isInfiniteScroll = view.infiniteScrollEnabled && ! dataByGroup;
	if ( ! hasData ) {
		return (
			<div
				className={ clsx( 'dataviews-no-results', {
					'is-refreshing': isDelayedLoading,
				} ) }
			>
				{ empty }
			</div>
		);
	}

	const isInert = ! isInfiniteScroll && !! isLoading;
	const wrapperClassName = clsx( 'dataviews-view-activity', className, {
		'is-refreshing': ! isInfiniteScroll && isDelayedLoading,
	} );

	// Convert dataByGroup entries into array.
	const groupedEntries = dataByGroup
		? Array.from( dataByGroup.entries() )
		: [];

	// Render grouped activity
	if ( hasData && groupField && dataByGroup ) {
		return (
			<Stack
				direction="column"
				gap="sm"
				className={ wrapperClassName }
				// @ts-ignore
				inert={ isInert ? 'true' : undefined }
			>
				{ groupedEntries.map(
					( [ groupName, groupData ]: [ string, Item[] ] ) => (
						<ActivityGroup< Item >
							key={ groupName }
							groupName={ groupName }
							groupData={ groupData }
							groupField={ groupField }
							showLabel={ view.groupBy?.showLabel !== false }
						>
							<ActivityItems< Item >
								{ ...props }
								data={ groupData }
							/>
						</ActivityGroup>
					)
				) }
			</Stack>
		);
	}

	// Render flat activity (no grouping)
	return (
		<>
			<div
				className={ wrapperClassName }
				role={ view.infiniteScrollEnabled ? 'feed' : undefined }
				// @ts-ignore
				inert={ isInert ? 'true' : undefined }
			>
				<ActivityItems< Item > { ...props } />
			</div>
			{ isInfiniteScroll && isLoading && (
				<p className="dataviews-loading-more">
					<Spinner />
				</p>
			) }
		</>
	);
}
