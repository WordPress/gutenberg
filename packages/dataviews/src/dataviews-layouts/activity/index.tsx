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
import type { ViewActivityProps } from '../../types';
import getDataByGroup from '../utils/get-data-by-group';
import ActivityGroup from './activity-group';
import ActivityItems from './activity-items';

export default function ViewActivity< Item >(
	props: ViewActivityProps< Item >
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

	const wrapperClassName = clsx( 'dataviews-view-activity', className );

	// Check if data should be grouped
	const groupField = view.groupBy?.field
		? fields.find( ( field ) => field.id === view.groupBy?.field )
		: null;
	const dataByGroup = groupField ? getDataByGroup( data, groupField ) : null;

	// Convert dataByGroup entries into array.
	const groupedEntries = dataByGroup
		? Array.from( dataByGroup.entries() )
		: [];

	// Render grouped activity
	if ( hasData && groupField && dataByGroup ) {
		return (
			<VStack spacing={ 2 } className={ wrapperClassName }>
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
			</VStack>
		);
	}

	// Render flat activity (no grouping)
	return (
		<>
			<div
				className={ wrapperClassName }
				role={ view.infiniteScrollEnabled ? 'feed' : undefined }
			>
				<ActivityItems< Item > { ...props } />
			</div>
			{ hasData && isLoading && (
				<p className="dataviews-loading-more">
					<Spinner />
				</p>
			) }
		</>
	);
}
