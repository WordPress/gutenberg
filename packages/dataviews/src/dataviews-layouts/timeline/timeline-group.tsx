/**
 * WordPress dependencies
 */
import { __experimentalVStack as VStack } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { createInterpolateElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { Action, NormalizedField, ViewTimeline } from '../../types';
import TimelineItem from './timeline-item';

interface TimelineGroupProps< Item > {
	groupName: string;
	groupItems: Item[];
	view: ViewTimeline;
	actions: Action< Item >[];
	getItemId: ( item: Item ) => string;
	titleField: NormalizedField< Item > | undefined;
	mediaField: NormalizedField< Item > | undefined;
	descriptionField: NormalizedField< Item > | undefined;
	groupField: NormalizedField< Item >;
	eventField: NormalizedField< Item > | undefined;
	eventIconSize?: 'default' | 'small' | 'medium';
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
	groupField,
	actions,
	getItemId,
	titleField,
	mediaField,
	descriptionField,
	eventField,
	eventIconSize,
	otherFields,
	onClickItem,
	renderItemLink,
	isItemClickable,
}: TimelineGroupProps< Item > ) {
	// Determine if we should show the field label
	const showGroupFieldLabel = view.layout?.showGroupFieldLabel ?? true;
	const groupHeader = showGroupFieldLabel ? (
		createInterpolateElement(
			// translators: %s: The label of the field e.g. "Status".
			sprintf( __( '%s: <groupName />' ), groupField.label ),
			{
				groupName: (
					<groupField.render
						item={ groupItems[ 0 ] }
						field={ groupField }
					/>
				),
			}
		)
	) : (
		<groupField.render item={ groupItems[ 0 ] } field={ groupField } />
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
						eventField={ eventField }
						eventIconSize={ eventIconSize }
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
