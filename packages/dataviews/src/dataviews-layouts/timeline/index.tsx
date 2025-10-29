/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useInstanceId, usePrevious } from '@wordpress/compose';
import {
	__experimentalVStack as VStack,
	Spinner,
	Composite,
} from '@wordpress/components';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { ViewTimelineProps } from '../../types';
import getDataByGroup from '../utils/get-data-by-group';
import TimelineItem from './timeline-item';
import {
	generateItemWrapperCompositeId,
	isDefined,
	generateDropdownTriggerCompositeId,
	getFormattedDate,
} from './utils';

export default function ViewTimeline< Item >(
	props: ViewTimelineProps< Item >
) {
	const {
		actions,
		data,
		fields,
		getItemId,
		isLoading,
		onChangeSelection,
		selection,
		view,
		className,
		empty,
	} = props;
	const baseId = useInstanceId( ViewTimeline, 'view-timeline' );

	const { eventField = undefined, dateFormat = undefined } =
		view?.layout ?? {};

	const selectedItem = data?.findLast( ( item ) =>
		selection.includes( getItemId( item ) )
	);
	const titleField = fields.find( ( field ) => field.id === view.titleField );
	const mediaField = fields.find( ( field ) => field.id === view.mediaField );
	const descriptionField = fields.find(
		( field ) => field.id === view.descriptionField
	);
	const otherFields = ( view?.fields ?? [] )
		.map( ( fieldId ) => fields.find( ( f ) => fieldId === f.id ) )
		.filter( isDefined );

	const onSelect = ( item: Item ) =>
		onChangeSelection( [ getItemId( item ) ] );

	const generateCompositeItemIdPrefix = useCallback(
		( item: Item ) => `${ baseId }-${ getItemId( item ) }`,
		[ baseId, getItemId ]
	);

	const isActiveCompositeItem = useCallback(
		( item: Item, idToCheck: string ) => {
			// All composite items use the same prefix in their IDs.
			return idToCheck.startsWith(
				generateCompositeItemIdPrefix( item )
			);
		},
		[ generateCompositeItemIdPrefix ]
	);

	// Controlled state for the active composite item.
	const [ activeCompositeId, setActiveCompositeId ] = useState<
		string | null | undefined
	>( undefined );

	// Update the active composite item when the selected item changes.
	useEffect( () => {
		if ( selectedItem ) {
			setActiveCompositeId(
				generateItemWrapperCompositeId(
					generateCompositeItemIdPrefix( selectedItem )
				)
			);
		}
	}, [ selectedItem, generateCompositeItemIdPrefix ] );

	const activeItemIndex = data.findIndex( ( item ) =>
		isActiveCompositeItem( item, activeCompositeId ?? '' )
	);
	const previousActiveItemIndex = usePrevious( activeItemIndex );
	const isActiveIdInList = activeItemIndex !== -1;

	const selectCompositeItem = useCallback(
		(
			targetIndex: number,
			// Allows invokers to specify a custom function to generate the
			// target composite item ID
			generateCompositeId: ( idPrefix: string ) => string
		) => {
			// Clamping between 0 and data.length - 1 to avoid out of bounds.
			const clampedIndex = Math.min(
				data.length - 1,
				Math.max( 0, targetIndex )
			);
			if ( ! data[ clampedIndex ] ) {
				return;
			}
			const itemIdPrefix = generateCompositeItemIdPrefix(
				data[ clampedIndex ]
			);
			const targetCompositeItemId = generateCompositeId( itemIdPrefix );

			setActiveCompositeId( targetCompositeItemId );
			document.getElementById( targetCompositeItemId )?.focus();
		},
		[ data, generateCompositeItemIdPrefix ]
	);

	// Select a new active composite item when the current active item
	// is removed from the list.
	useEffect( () => {
		const wasActiveIdInList =
			previousActiveItemIndex !== undefined &&
			previousActiveItemIndex !== -1;
		if ( ! isActiveIdInList && wasActiveIdInList ) {
			// By picking `previousActiveItemIndex` as the next item index, we are
			// basically picking the item that would have been after the deleted one.
			// If the previously active (and removed) item was the last of the list,
			// we will select the item before it — which is the new last item.
			selectCompositeItem(
				previousActiveItemIndex,
				generateItemWrapperCompositeId
			);
		}
	}, [ isActiveIdInList, selectCompositeItem, previousActiveItemIndex ] );

	// Prevent the default behavior (open dropdown menu) and instead select the
	// dropdown menu trigger on the previous/next row.
	// https://github.com/ariakit/ariakit/issues/3768
	const onDropdownTriggerKeyDown = useCallback(
		( event: React.KeyboardEvent< HTMLButtonElement > ) => {
			if ( event.key === 'ArrowDown' ) {
				// Select the dropdown menu trigger item in the next row.
				event.preventDefault();
				selectCompositeItem(
					activeItemIndex + 1,
					generateDropdownTriggerCompositeId
				);
			}
			if ( event.key === 'ArrowUp' ) {
				// Select the dropdown menu trigger item in the previous row.
				event.preventDefault();
				selectCompositeItem(
					activeItemIndex - 1,
					generateDropdownTriggerCompositeId
				);
			}
		},
		[ selectCompositeItem, activeItemIndex ]
	);

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

	const groupField = view.groupByField
		? fields.find( ( field ) => field.id === view.groupByField )
		: null;
	const dataByGroup = groupField ? getDataByGroup( data, groupField ) : null;

	// Render data grouped by field
	if ( hasData && groupField && dataByGroup ) {
		return (
			<Composite
				id={ `${ baseId }` }
				render={ <div /> }
				className="dataviews-view-timeline__group"
				role="grid"
				activeId={ activeCompositeId }
				setActiveId={ setActiveCompositeId }
			>
				<VStack
					spacing={ 4 }
					className={ clsx( 'dataviews-view-timeline', className ) }
				>
					{ Array.from( dataByGroup.entries() ).map(
						( [ groupName, groupItems ] ) => (
							<VStack key={ groupName } spacing={ 0 }>
								<h3 className="dataviews-view-timeline__group-header">
									{ eventField === groupField.id
										? getFormattedDate(
												groupName,
												dateFormat
										  )
										: sprintf(
												// translators: 1: The label of the field e.g. "Date". 2: The value of the field, e.g.: "May 2022".
												__( '%1$s: %2$s' ),
												groupField.label,
												groupName
										  ) }
								</h3>
								{ groupItems.map( ( item ) => {
									const id =
										generateCompositeItemIdPrefix( item );
									return (
										<TimelineItem
											key={ id }
											view={ view }
											idPrefix={ id }
											actions={ actions }
											item={ item }
											isSelected={ item === selectedItem }
											onSelect={ onSelect }
											mediaField={ mediaField }
											titleField={ titleField }
											descriptionField={
												descriptionField
											}
											otherFields={ otherFields }
											onDropdownTriggerKeyDown={
												onDropdownTriggerKeyDown
											}
										/>
									);
								} ) }
							</VStack>
						)
					) }
				</VStack>
			</Composite>
		);
	}

	// Render ungrouped data
	return (
		<>
			<Composite
				id={ baseId }
				render={ <div /> }
				className={ clsx( 'dataviews-view-timeline', className ) }
				role={ view.infiniteScrollEnabled ? 'feed' : 'grid' }
				activeId={ activeCompositeId }
				setActiveId={ setActiveCompositeId }
			>
				{ data.map( ( item, index ) => {
					const id = generateCompositeItemIdPrefix( item );
					return (
						<TimelineItem
							key={ id }
							view={ view }
							idPrefix={ id }
							actions={ actions }
							item={ item }
							isSelected={ item === selectedItem }
							onSelect={ onSelect }
							mediaField={ mediaField }
							titleField={ titleField }
							descriptionField={ descriptionField }
							otherFields={ otherFields }
							onDropdownTriggerKeyDown={
								onDropdownTriggerKeyDown
							}
							posinset={
								view.infiniteScrollEnabled
									? index + 1
									: undefined
							}
						/>
					);
				} ) }
			</Composite>
			{ hasData && isLoading && (
				<p className="dataviews-loading-more">
					<Spinner />
				</p>
			) }
		</>
	);
}
