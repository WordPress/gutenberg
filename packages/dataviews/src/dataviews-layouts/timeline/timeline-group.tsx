/**
 * WordPress dependencies
 */
import { __experimentalVStack as VStack } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { Action, NormalizedField, ViewTimeline } from '../../types';
import TimelineItem from './timeline-item';
import { getFormattedDate } from './utils';

interface TimelineGroupProps< Item > {
	groupName: string;
	groupItems: Item[];
	view: ViewTimeline;
	eventField: string | undefined;
	groupFieldLabel: string;
	actions: Action< Item >[];
	getItemId: ( item: Item ) => string;
	titleField: NormalizedField< Item > | undefined;
	mediaField: NormalizedField< Item > | undefined;
	descriptionField: NormalizedField< Item > | undefined;
	eventFieldObject: NormalizedField< Item > | undefined;
	otherFields: NormalizedField< Item >[];
	onClickItem?: ( item: Item ) => void;
	renderItemLink?: (
		props: {
			item: Item;
		} & React.ComponentProps< 'a' >
	) => React.ReactElement;
	isItemClickable: ( item: Item ) => boolean;
}

export default function TimelineGroup< Item >( {
	groupName,
	groupItems,
	view,
	eventField,
	groupFieldLabel,
	actions,
	getItemId,
	titleField,
	mediaField,
	descriptionField,
	eventFieldObject,
	otherFields,
	onClickItem,
	renderItemLink,
	isItemClickable,
}: TimelineGroupProps< Item > ) {
	// Determine if group header should show formatted date or field label
	const isEventFieldGroup = eventField && eventField === view.groupByField;
	const groupHeader = isEventFieldGroup
		? getFormattedDate( groupName )
		: sprintf(
				// translators: 1: The label of the field e.g. "Status". 2: The value of the field, e.g.: "Published".
				__( '%1$s: %2$s' ),
				groupFieldLabel,
				groupName
		  );

	return (
		<VStack key={ groupName } spacing={ 0 }>
			<h3 className="dataviews-view-timeline__group-header">
				{ groupHeader }
			</h3>
			{ groupItems.map( ( item ) => {
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
						eventFieldObject={ eventFieldObject }
						otherFields={ otherFields }
						onClickItem={ onClickItem }
						renderItemLink={ renderItemLink }
						isItemClickable={ isItemClickable }
					/>
				);
			} ) }
		</VStack>
	);
}
