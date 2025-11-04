/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import {
	__experimentalVStack as VStack,
	Spinner,
	Composite,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import type { ViewTimelineProps } from '../../types';
import getDataByGroup from '../utils/get-data-by-group';
import TimelineItem from './timeline-item';
import TimelineGroup from './timeline-group';
import { useTimelineComposite } from './use-timeline-composite';
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
		onChangeSelection,
		selection,
		view,
		className,
		empty,
	} = props;

	const baseId = useInstanceId( ViewTimeline, 'view-timeline' );

	// Extract layout configuration
	const { eventField = undefined } = view?.layout ?? {};

	// Determine which fields to display based on view configuration
	const selectedItem = data?.findLast( ( item ) =>
		selection.includes( getItemId( item ) )
	);
	const titleField = fields.find( ( field ) => field.id === view.titleField );
	const mediaField = fields.find( ( field ) => field.id === view.mediaField );
	const descriptionField = fields.find(
		( field ) => field.id === view.descriptionField
	);
	const eventFieldObject = eventField
		? fields.find( ( field ) => field.id === eventField )
		: undefined;
	const otherFields = ( view?.fields ?? [] )
		.map( ( fieldId ) => fields.find( ( f ) => fieldId === f.id ) )
		.filter( isDefined );

	// Selection handler
	const onSelect = ( item: Item ) =>
		onChangeSelection( [ getItemId( item ) ] );

	// Keyboard navigation state and handlers
	const {
		activeCompositeId,
		setActiveCompositeId,
		generateCompositeItemIdPrefix,
		onDropdownTriggerKeyDown,
	} = useTimelineComposite( {
		data,
		getItemId,
		baseId,
		selectedItem,
	} );

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

	// Render grouped timeline
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
							<TimelineGroup
								key={ groupName }
								groupName={ groupName }
								groupItems={ groupItems }
								view={ view }
								eventField={ eventField }
								groupFieldLabel={ groupField.label }
								actions={ actions }
								selectedItem={ selectedItem }
								onSelect={ onSelect }
								titleField={ titleField }
								mediaField={ mediaField }
								descriptionField={ descriptionField }
								eventFieldObject={ eventFieldObject }
								otherFields={ otherFields }
								generateCompositeItemIdPrefix={
									generateCompositeItemIdPrefix
								}
								onDropdownTriggerKeyDown={
									onDropdownTriggerKeyDown
								}
							/>
						)
					) }
				</VStack>
			</Composite>
		);
	}

	// Render flat timeline (no grouping)
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
							eventFieldObject={ eventFieldObject }
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
