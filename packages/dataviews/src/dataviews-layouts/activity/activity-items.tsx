/**
 * Internal dependencies
 */
import ActivityItem from './activity-item';
import type { ViewActivityProps } from '../../types';

function isDefined< T >( item: T | undefined ): item is T {
	return !! item;
}

export default function ActivityItems< Item >(
	props: ViewActivityProps< Item >
) {
	const { data, fields, getItemId, view } = props;

	// Determine which fields to display based on view configuration
	const titleField = fields.find( ( field ) => field.id === view.titleField );
	const mediaField = fields.find( ( field ) => field.id === view.mediaField );
	const descriptionField = fields.find(
		( field ) => field.id === view.descriptionField
	);
	const otherFields = ( view?.fields ?? [] )
		.map( ( fieldId ) => fields.find( ( f ) => fieldId === f.id ) )
		.filter( isDefined );

	return data.map( ( item, index ) => {
		return (
			<ActivityItem
				{ ...props }
				key={ getItemId( item ) }
				item={ item }
				mediaField={ mediaField }
				titleField={ titleField }
				descriptionField={ descriptionField }
				otherFields={ otherFields }
				posinset={ view.infiniteScrollEnabled ? index + 1 : undefined }
			/>
		);
	} );
}
