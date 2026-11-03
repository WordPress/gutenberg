import type { CSSProperties, KeyboardEvent } from 'react';
import {
	DndContext,
	KeyboardSensor,
	PointerSensor,
	closestCenter,
	useSensor,
	useSensors,
} from '@dnd-kit/core';
import type { Announcements, DragEndEvent } from '@dnd-kit/core';
import {
	SortableContext,
	arrayMove,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import clsx from 'clsx';
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalItem as Item,
	BaseControl,
	Icon as WCIcon,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useContext, useMemo } from '@wordpress/element';
import { check, dragHandle } from '@wordpress/icons';
import { Stack } from '@wordpress/ui';
import type { NormalizedField } from '../../types';
import DataViewsContext from '../dataviews-context';
import { applyFieldOrder, getFieldOrder } from '../../utils/field-order';

function FieldLabel( {
	field,
	isVisible,
}: {
	field: NormalizedField< any >;
	isVisible: boolean;
} ) {
	return (
		<Stack direction="row" gap="sm" justify="flex-start" align="center">
			<div style={ { height: 24, width: 24 } }>
				{ isVisible && <WCIcon icon={ check } /> }
			</div>
			<span className="dataviews-view-config__label">
				{ field.label }
			</span>
		</Stack>
	);
}

function FieldItem( {
	field,
	isVisible,
	onToggleVisibility,
}: {
	field: NormalizedField< any >;
	isVisible: boolean;
	onToggleVisibility?: () => void;
} ) {
	return (
		<Item onClick={ field.enableHiding ? onToggleVisibility : undefined }>
			<FieldLabel field={ field } isVisible={ isVisible } />
		</Item>
	);
}

/**
 * A field the user can move. Unlike `FieldItem`, the row isn't one button,
 * because a button can't hold the drag handle (another button). The toggle
 * and the handle sit side by side inside it instead.
 */
function SortableFieldItem( {
	field,
	isVisible,
	onToggleVisibility,
}: {
	field: NormalizedField< any >;
	isVisible: boolean;
	onToggleVisibility: () => void;
} ) {
	const {
		attributes,
		listeners,
		setNodeRef,
		setActivatorNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable( { id: field.id } );

	// The list only moves up and down.
	const style: CSSProperties = {
		transform: transform
			? `translate3d(0, ${ Math.round( transform.y ) }px, 0)`
			: undefined,
		transition,
	};

	const label = <FieldLabel field={ field } isVisible={ isVisible } />;

	return (
		<Item
			ref={ setNodeRef }
			style={ style }
			className={ clsx( 'dataviews-view-config__sortable-field', {
				'is-dragging': isDragging,
			} ) }
		>
			{ field.enableHiding ? (
				<button
					type="button"
					className="dataviews-view-config__field-toggle"
					onClick={ onToggleVisibility }
				>
					{ label }
				</button>
			) : (
				<div className="dataviews-view-config__field-toggle">
					{ label }
				</div>
			) }
			<button
				type="button"
				ref={ setActivatorNodeRef }
				className="dataviews-view-config__field-handle"
				{ ...attributes }
				{ ...listeners }
				onKeyDown={ ( event: KeyboardEvent< HTMLButtonElement > ) => {
					// Escape cancels the drag. Marking it handled stops the
					// popover from also closing on it, which would lose the
					// user's place. The drag still sees it: the keyboard
					// sensor listens on the document.
					if ( event.key === 'Escape' && isDragging ) {
						event.preventDefault();
					}
					listeners?.onKeyDown?.( event );
				} }
				aria-label={ sprintf(
					/* translators: %s: field label, e.g. "Author". */
					__( 'Reorder %s' ),
					field.label
				) }
			>
				<WCIcon icon={ dragHandle } size={ 20 } />
			</button>
		</Item>
	);
}

function isDefined< T >( item: T | undefined ): item is T {
	return !! item;
}

export function PropertiesSection( {
	showLabel = true,
}: {
	showLabel?: boolean;
} ) {
	const { view, fields, onChangeView } = useContext( DataViewsContext );

	// Every field the user can show, hide or move, hidden ones included, in
	// the order they sit in the view.
	const order = getFieldOrder( view, fields );
	const regularFields = order
		.map( ( id ) => fields.find( ( f ) => f.id === id ) )
		.filter( isDefined );

	// A short distance before a drag starts, so pressing the handle without
	// moving doesn't count as one.
	const sensors = useSensors(
		useSensor( PointerSensor, { activationConstraint: { distance: 4 } } ),
		useSensor( KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		} )
	);

	const orderKey = order.join( ',' );
	const accessibility = useMemo( () => {
		const ids = orderKey.split( ',' );
		const labelOf = ( id: string | number ) =>
			fields.find( ( f ) => f.id === id )?.label ?? String( id );
		const positionOf = ( id: string | number ) =>
			ids.indexOf( String( id ) ) + 1;

		const announcements: Announcements = {
			onDragStart: ( { active } ) =>
				sprintf(
					/* translators: 1: field label. 2: position in the list. 3: number of items in the list. */
					__( 'Picked up %1$s, at position %2$d of %3$d.' ),
					labelOf( active.id ),
					positionOf( active.id ),
					ids.length
				),
			onDragOver: ( { active, over } ) =>
				over
					? sprintf(
							/* translators: 1: field label. 2: position in the list. 3: number of items in the list. */
							__( '%1$s moved to position %2$d of %3$d.' ),
							labelOf( active.id ),
							positionOf( over.id ),
							ids.length
						)
					: undefined,
			onDragEnd: ( { active, over } ) =>
				over
					? sprintf(
							/* translators: 1: field label. 2: position in the list. 3: number of items in the list. */
							__( '%1$s dropped at position %2$d of %3$d.' ),
							labelOf( active.id ),
							positionOf( over.id ),
							ids.length
						)
					: undefined,
			onDragCancel: ( { active } ) =>
				sprintf(
					/* translators: %s: field label. */
					__( 'Moving %s was cancelled.' ),
					labelOf( active.id )
				),
		};

		return {
			announcements,
			screenReaderInstructions: {
				draggable: __(
					'To pick up a property, press Space or Enter. Use the up and down arrow keys to move it. Press Space or Enter again to drop it in its new position, or Escape to cancel.'
				),
			},
		};
	}, [ fields, orderKey ] );

	if ( ! regularFields.length ) {
		return null;
	}
	const titleField = fields.find( ( f ) => f.id === view.titleField );
	const previewField = fields.find( ( f ) => f.id === view.mediaField );
	const descriptionField = fields.find(
		( f ) => f.id === view.descriptionField
	);

	const lockedFields = [
		{
			field: titleField,
			isVisibleFlag: 'showTitle',
		},
		{
			field: previewField,
			isVisibleFlag: 'showMedia',
		},
		{
			field: descriptionField,
			isVisibleFlag: 'showDescription',
		},
	].filter( ( { field } ) => isDefined( field ) ) as Array< {
		field: NormalizedField< any >;
		isVisibleFlag: 'showTitle' | 'showMedia' | 'showDescription';
	} >;
	const visibleFieldIds = ( view.fields ?? [] ).filter( ( id ) =>
		order.includes( id )
	);

	const visibleLockedFields = lockedFields.filter(
		( { isVisibleFlag } ) => view[ isVisibleFlag ] ?? true
	);

	// If only one field (locked or regular) is visible, prevent it from being hidden
	const totalVisibleFields =
		visibleLockedFields.length + visibleFieldIds.length;
	const isSingleVisibleLockedField =
		totalVisibleFields === 1 && visibleLockedFields.length === 1;

	const onDragEnd = ( { active, over }: DragEndEvent ) => {
		if ( ! over || active.id === over.id ) {
			return;
		}
		const from = order.indexOf( String( active.id ) );
		const to = order.indexOf( String( over.id ) );
		if ( from < 0 || to < 0 ) {
			return;
		}
		onChangeView(
			applyFieldOrder(
				view,
				arrayMove( order, from, to ),
				visibleFieldIds
			)
		);
	};

	return (
		<Stack direction="column" className="dataviews-field-control">
			{ showLabel && (
				<BaseControl.VisualLabel>
					{ __( 'Properties' ) }
				</BaseControl.VisualLabel>
			) }
			<Stack
				direction="column"
				className="dataviews-view-config__properties"
			>
				<DndContext
					sensors={ sensors }
					collisionDetection={ closestCenter }
					onDragEnd={ onDragEnd }
					accessibility={ accessibility }
				>
					<SortableContext
						items={ order }
						strategy={ verticalListSortingStrategy }
					>
						<ItemGroup isBordered isSeparated size="medium">
							{ lockedFields.map(
								( { field, isVisibleFlag } ) => {
									const isVisible =
										view[ isVisibleFlag ] ?? true;
									const fieldToRender =
										isSingleVisibleLockedField && isVisible
											? { ...field, enableHiding: false }
											: field;

									return (
										<FieldItem
											key={ field.id }
											field={ fieldToRender }
											isVisible={ isVisible }
											onToggleVisibility={ () => {
												onChangeView( {
													...view,
													[ isVisibleFlag ]:
														! isVisible,
												} );
											} }
										/>
									);
								}
							) }

							{ regularFields.map( ( field ) => {
								// Check if this is the last visible field to prevent hiding
								const isVisible = visibleFieldIds.includes(
									field.id
								);
								const fieldToRender =
									totalVisibleFields === 1 && isVisible
										? { ...field, enableHiding: false }
										: field;

								return (
									<SortableFieldItem
										key={ field.id }
										field={ fieldToRender }
										isVisible={ isVisible }
										onToggleVisibility={ () => {
											// The field keeps its place in the
											// order either way, so it comes
											// back where it was.
											const nextVisibleIds = isVisible
												? visibleFieldIds.filter(
														( id ) =>
															id !== field.id
													)
												: [
														...visibleFieldIds,
														field.id,
													];
											onChangeView(
												applyFieldOrder(
													view,
													order,
													nextVisibleIds
												)
											);
										} }
									/>
								);
							} ) }
						</ItemGroup>
					</SortableContext>
				</DndContext>
			</Stack>
		</Stack>
	);
}
