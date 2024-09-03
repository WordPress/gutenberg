/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { useInstanceId, usePrevious } from '@wordpress/compose';
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	Button,
	privateApis as componentsPrivateApis,
	Spinner,
	VisuallyHidden,
} from '@wordpress/components';
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { moreVertical } from '@wordpress/icons';
import { useRegistry } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import {
	ActionsDropdownMenuGroup,
	ActionModal,
} from '../../components/dataviews-item-actions';
import type { Action, NormalizedField, ViewListProps } from '../../types';

interface ListViewItemProps< Item > {
	actions: Action< Item >[];
	id: string;
	isSelected: boolean;
	item: Item;
	mediaField?: NormalizedField< Item >;
	onSelect: ( item: Item ) => void;
	primaryField?: NormalizedField< Item >;
	visibleFields: NormalizedField< Item >[];
	onDropdownTriggerKeyDown: React.KeyboardEventHandler< HTMLButtonElement >;
}

const {
	CompositeV2: Composite,
	CompositeItemV2: CompositeItem,
	CompositeRowV2: CompositeRow,
	DropdownMenuV2: DropdownMenu,
} = unlock( componentsPrivateApis );

function generateDropdownTriggerCompositeId( domId: string ) {
	return `${ domId }-dropdown`;
}

function PrimaryActionGridCell< Item >( {
	primaryAction,
	id,
	item,
}: {
	id: string;
	primaryAction: Action< Item >;
	item: Item;
} ) {
	const registry = useRegistry();
	const [ isModalOpen, setIsModalOpen ] = useState( false );

	const compositeItemId = `${ id }-${ primaryAction.id }`;

	const label =
		typeof primaryAction.label === 'string'
			? primaryAction.label
			: primaryAction.label( [ item ] );

	return 'RenderModal' in primaryAction ? (
		<div role="gridcell">
			<CompositeItem
				id={ compositeItemId }
				render={
					<Button
						label={ label }
						icon={ primaryAction.icon }
						isDestructive={ primaryAction.isDestructive }
						size="small"
						onClick={ () => setIsModalOpen( true ) }
					/>
				}
			>
				{ isModalOpen && (
					<ActionModal< Item >
						action={ primaryAction }
						items={ [ item ] }
						closeModal={ () => setIsModalOpen( false ) }
					/>
				) }
			</CompositeItem>
		</div>
	) : (
		<div role="gridcell" key={ primaryAction.id }>
			<CompositeItem
				id={ compositeItemId }
				render={
					<Button
						label={ label }
						icon={ primaryAction.icon }
						isDestructive={ primaryAction.isDestructive }
						size="small"
						onClick={ () => {
							primaryAction.callback( [ item ], { registry } );
						} }
					/>
				}
			/>
		</div>
	);
}

function ListItem< Item >( {
	actions,
	id,
	isSelected,
	item,
	mediaField,
	onSelect,
	primaryField,
	visibleFields,
	onDropdownTriggerKeyDown,
}: ListViewItemProps< Item > ) {
	const itemRef = useRef< HTMLElement >( null );
	const labelId = `${ id }-label`;
	const descriptionId = `${ id }-description`;

	const [ isHovered, setIsHovered ] = useState( false );
	const handleMouseEnter = () => {
		setIsHovered( true );
	};
	const handleMouseLeave = () => {
		setIsHovered( false );
	};

	useEffect( () => {
		if ( isSelected ) {
			itemRef.current?.scrollIntoView( {
				behavior: 'auto',
				block: 'nearest',
				inline: 'nearest',
			} );
		}
	}, [ isSelected ] );

	const { primaryAction, eligibleActions } = useMemo( () => {
		// If an action is eligible for all items, doesn't need
		// to provide the `isEligible` function.
		const _eligibleActions = actions.filter(
			( action ) => ! action.isEligible || action.isEligible( item )
		);
		const _primaryActions = _eligibleActions.filter(
			( action ) => action.isPrimary && !! action.icon
		);
		return {
			primaryAction: _primaryActions?.[ 0 ],
			eligibleActions: _eligibleActions,
		};
	}, [ actions, item ] );

	const renderedMediaField = mediaField?.render ? (
		<mediaField.render item={ item } />
	) : (
		<div className="dataviews-view-list__media-placeholder"></div>
	);

	const renderedPrimaryField = primaryField?.render ? (
		<primaryField.render item={ item } />
	) : null;

	return (
		<CompositeRow
			ref={ itemRef }
			render={ <li /> }
			role="row"
			className={ clsx( {
				'is-selected': isSelected,
				'is-hovered': isHovered,
			} ) }
			onMouseEnter={ handleMouseEnter }
			onMouseLeave={ handleMouseLeave }
		>
			<HStack
				className="dataviews-view-list__item-wrapper"
				alignment="center"
				spacing={ 0 }
			>
				<div role="gridcell">
					<CompositeItem
						render={ <div /> }
						role="button"
						id={ id }
						aria-pressed={ isSelected }
						aria-labelledby={ labelId }
						aria-describedby={ descriptionId }
						className="dataviews-view-list__item"
						onClick={ () => onSelect( item ) }
					>
						<HStack
							spacing={ 3 }
							justify="start"
							alignment="flex-start"
						>
							<div className="dataviews-view-list__media-wrapper">
								{ renderedMediaField }
							</div>
							<VStack
								spacing={ 1 }
								className="dataviews-view-list__field-wrapper"
							>
								<span
									className="dataviews-view-list__primary-field"
									id={ labelId }
								>
									{ renderedPrimaryField }
								</span>
								<div
									className="dataviews-view-list__fields"
									id={ descriptionId }
								>
									{ visibleFields.map( ( field ) => (
										<div
											key={ field.id }
											className="dataviews-view-list__field"
										>
											<VisuallyHidden
												as="span"
												className="dataviews-view-list__field-label"
											>
												{ field.label }
											</VisuallyHidden>
											<span className="dataviews-view-list__field-value">
												<field.render item={ item } />
											</span>
										</div>
									) ) }
								</div>
							</VStack>
						</HStack>
					</CompositeItem>
				</div>
				{ eligibleActions?.length > 0 && (
					<HStack
						spacing={ 3 }
						justify="flex-end"
						className="dataviews-view-list__item-actions"
						style={ {
							flexShrink: '0',
							width: 'auto',
						} }
					>
						{ primaryAction && (
							<PrimaryActionGridCell
								id={ id }
								primaryAction={ primaryAction }
								item={ item }
							/>
						) }
						<div role="gridcell">
							<DropdownMenu
								trigger={
									<CompositeItem
										id={ generateDropdownTriggerCompositeId(
											id
										) }
										render={
											<Button
												size="small"
												icon={ moreVertical }
												label={ __( 'Actions' ) }
												accessibleWhenDisabled
												disabled={ ! actions.length }
												onKeyDown={
													onDropdownTriggerKeyDown
												}
											/>
										}
									/>
								}
								placement="bottom-end"
							>
								<ActionsDropdownMenuGroup
									actions={ eligibleActions }
									item={ item }
								/>
							</DropdownMenu>
						</div>
					</HStack>
				) }
			</HStack>
		</CompositeRow>
	);
}

export default function ViewList< Item >( props: ViewListProps< Item > ) {
	const {
		actions,
		data,
		fields,
		getItemId,
		isLoading,
		onChangeSelection,
		selection,
		view,
	} = props;
	const baseId = useInstanceId( ViewList, 'view-list' );

	const selectedItem = data?.findLast( ( item ) =>
		selection.includes( getItemId( item ) )
	);

	const mediaField = fields.find(
		( field ) => field.id === view.layout?.mediaField
	);
	const primaryField = fields.find(
		( field ) => field.id === view.layout?.primaryField
	);
	const viewFields = view.fields || fields.map( ( field ) => field.id );
	const visibleFields = fields.filter(
		( field ) =>
			viewFields.includes( field.id ) &&
			! [ view.layout?.primaryField, view.layout?.mediaField ].includes(
				field.id
			)
	);

	const onSelect = ( item: Item ) =>
		onChangeSelection( [ getItemId( item ) ] );

	const getItemDomId = useCallback(
		( item: Item ) => `${ baseId }-${ getItemId( item ) }`,
		[ baseId, getItemId ]
	);

	const [ activeCompositeId, setActiveCompositeId ] = useState<
		string | null | undefined
	>(
		// By default, the active composite item is the selected one.
		selectedItem ? getItemDomId( selectedItem ) : undefined
	);

	const activeItemIndex = data.findIndex( ( item ) => {
		const itemCompositeIdPrefix = getItemDomId( item );
		return (
			!! itemCompositeIdPrefix &&
			activeCompositeId?.startsWith( itemCompositeIdPrefix )
		);
	} );
	const previousActiveItemIndex = usePrevious( activeItemIndex );
	const isActiveIdInList = activeItemIndex !== -1;

	const selectCompositeItem = useCallback(
		(
			targetIndex: number,
			// Allows invokers to specify a custom function to generate the
			// target composite item ID (e.g. for the dropdown menu trigger).
			getCompositeId = ( id: string ) => id
		) => {
			// Clamping between 0 and data.length - 1 to avoid out of bounds.
			const clampedIndex = Math.min(
				data.length - 1,
				Math.max( 0, targetIndex )
			);
			const domId = getItemDomId( data[ clampedIndex ] );
			const targetCompositeItemId = getCompositeId( domId );

			setActiveCompositeId( targetCompositeItemId );
			document.getElementById( targetCompositeItemId )?.focus();
		},
		[ data, getItemDomId ]
	);

	// Select a new active composite item when the current active item
	// is removed from the list.
	useEffect( () => {
		if ( ! isActiveIdInList ) {
			// By picking `previousActiveItemIndex` as the next item index, we are
			// basically picking the item that would have been after the deleted one.
			// If the previously active (and removed) item was the last of the list,
			// we will select the item before it — which is the new last item.
			selectCompositeItem( previousActiveItemIndex ?? 0 );
		}
	}, [ previousActiveItemIndex, isActiveIdInList, selectCompositeItem ] );

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
				{ ! hasData && (
					<p>{ isLoading ? <Spinner /> : __( 'No results' ) }</p>
				) }
			</div>
		);
	}

	return (
		<Composite
			id={ baseId }
			render={ <ul /> }
			className="dataviews-view-list"
			role="grid"
			activeId={ activeCompositeId }
			setActiveId={ setActiveCompositeId }
		>
			{ data.map( ( item ) => {
				const id = getItemDomId( item );
				return (
					<ListItem
						key={ id }
						id={ id }
						actions={ actions }
						item={ item }
						isSelected={ item === selectedItem }
						onSelect={ onSelect }
						mediaField={ mediaField }
						primaryField={ primaryField }
						visibleFields={ visibleFields }
						onDropdownTriggerKeyDown={ onDropdownTriggerKeyDown }
					/>
				);
			} ) }
		</Composite>
	);
}
