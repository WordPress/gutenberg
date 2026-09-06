import clsx from 'clsx';
import { useInstanceId, usePrevious } from '@wordpress/compose';
import { Button, Spinner, Composite } from '@wordpress/components';
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	useContext,
} from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { moreVertical } from '@wordpress/icons';
import { useRegistry } from '@wordpress/data';
// eslint-disable-next-line @wordpress/use-recommended-components -- Intentional early adoption of the new Menu, pending WordPress/gutenberg#76135.
import { Menu, Stack, VisuallyHidden } from '@wordpress/ui';
import { ActionsMenuGroup, ActionModal } from '../../dataviews-item-actions';
import DataViewsContext from '../../dataviews-context';
import { useDelayedLoading } from '../../../hooks/use-delayed-loading';
import type {
	Action,
	NormalizedField,
	ViewList as ViewListType,
	ViewListProps,
	ActionModal as ActionModalType,
} from '../../../types';
import getDataByGroup from '../utils/get-data-by-group';
import useSelectionProps from '../utils/use-selection-props';
import type { SelectionProps } from '../utils/use-selection-props';

interface ListViewItemProps< Item > {
	view: ViewListType;
	actions: Action< Item >[];
	idPrefix: string;
	isSelected: boolean;
	item: Item;
	titleField?: NormalizedField< Item >;
	mediaField?: NormalizedField< Item >;
	descriptionField?: NormalizedField< Item >;
	selectionProps: SelectionProps;
	otherFields: NormalizedField< Item >[];
	onDropdownTriggerKeyDown: React.KeyboardEventHandler< HTMLButtonElement >;
	posinset?: number;
}

function generateItemWrapperCompositeId( idPrefix: string ) {
	return `${ idPrefix }-item-wrapper`;
}
function generatePrimaryActionCompositeId(
	idPrefix: string,
	primaryActionId: string
) {
	return `${ idPrefix }-primary-action-${ primaryActionId }`;
}
function generateDropdownTriggerCompositeId( idPrefix: string ) {
	return `${ idPrefix }-dropdown`;
}

function PrimaryActionGridCell< Item >( {
	idPrefix,
	primaryAction,
	item,
}: {
	idPrefix: string;
	primaryAction: Action< Item >;
	item: Item;
} ) {
	const registry = useRegistry();
	const [ isModalOpen, setIsModalOpen ] = useState( false );

	const compositeItemId = generatePrimaryActionCompositeId(
		idPrefix,
		primaryAction.id
	);

	const label =
		typeof primaryAction.label === 'string'
			? primaryAction.label
			: primaryAction.label( [ item ] );

	return 'RenderModal' in primaryAction ? (
		<div role="gridcell" key={ primaryAction.id }>
			<Composite.Item
				id={ compositeItemId }
				render={
					<Button
						disabled={ !! primaryAction.disabled }
						accessibleWhenDisabled
						text={ label }
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
			</Composite.Item>
		</div>
	) : (
		<div role="gridcell" key={ primaryAction.id }>
			<Composite.Item
				id={ compositeItemId }
				render={
					<Button
						disabled={ !! primaryAction.disabled }
						accessibleWhenDisabled
						size="small"
						onClick={ () => {
							primaryAction.callback( [ item ], { registry } );
						} }
					>
						{ label }
					</Button>
				}
			/>
		</div>
	);
}

function ListItem< Item >( {
	view,
	actions,
	idPrefix,
	isSelected,
	item,
	titleField,
	mediaField,
	descriptionField,
	selectionProps,
	otherFields,
	onDropdownTriggerKeyDown,
	posinset,
}: ListViewItemProps< Item > ) {
	const {
		showTitle = true,
		showMedia = true,
		showDescription = true,
		infiniteScrollEnabled,
	} = view;
	const itemRef = useRef< HTMLDivElement >( null );
	const labelId = `${ idPrefix }-label`;
	const descriptionId = `${ idPrefix }-description`;

	const registry = useRegistry();
	const [ isHovered, setIsHovered ] = useState( false );
	const [ activeModalAction, setActiveModalAction ] = useState(
		null as ActionModalType< Item > | null
	);
	const handleHover: React.MouseEventHandler = ( { type } ) => {
		const isHover = type === 'mouseenter';
		setIsHovered( isHover );
	};

	const { paginationInfo } = useContext( DataViewsContext );
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
			( action ) => action.isPrimary
		);
		return {
			primaryAction: _primaryActions[ 0 ],
			eligibleActions: _eligibleActions,
		};
	}, [ actions, item ] );

	const hasOnlyOnePrimaryAction = primaryAction && actions.length === 1;

	const renderedMediaField =
		showMedia && mediaField?.render ? (
			<div className="dataviews-view-list__media-wrapper">
				<mediaField.render
					item={ item }
					field={ mediaField }
					config={ { sizes: '52px' } }
				/>
			</div>
		) : null;

	const renderedTitleField =
		showTitle && titleField?.render ? (
			<titleField.render item={ item } field={ titleField } />
		) : null;

	const renderDescription = showDescription && descriptionField?.render;
	// When we have only the media and title fields, we want to center them vertically in the list item.
	const hasOnlyMediaAndTitle =
		!! renderedMediaField && ! renderDescription && ! otherFields.length;
	const usedActions = eligibleActions?.length > 0 && (
		<Stack
			direction="row"
			gap="md"
			className="dataviews-view-list__item-actions"
		>
			{ primaryAction && (
				<PrimaryActionGridCell
					idPrefix={ idPrefix }
					primaryAction={ primaryAction }
					item={ item }
				/>
			) }
			{ ! hasOnlyOnePrimaryAction && (
				<div role="gridcell">
					{ /* The `disabled` prop on `Menu.Root` (rather than on
					     the trigger) keeps the menu from opening while
					     letting the trigger button stay focusable via its
					     own `accessibleWhenDisabled`. */ }
					<Menu.Root disabled={ ! actions.length }>
						<Menu.Trigger
							render={
								<Composite.Item
									id={ generateDropdownTriggerCompositeId(
										idPrefix
									) }
									accessibleWhenDisabled
									render={
										<Button
											size="small"
											icon={ moreVertical }
											label={ __( 'Actions' ) }
											accessibleWhenDisabled
											disabled={ ! actions.length }
											onKeyDownCapture={
												onDropdownTriggerKeyDown
											}
										/>
									}
								/>
							}
						/>
						<Menu.Popup
							positioner={ <Menu.Positioner align="end" /> }
						>
							<ActionsMenuGroup
								actions={ eligibleActions }
								item={ item }
								registry={ registry }
								setActiveModalAction={ setActiveModalAction }
							/>
						</Menu.Popup>
					</Menu.Root>
					{ !! activeModalAction && (
						<ActionModal
							action={ activeModalAction }
							items={ [ item ] }
							closeModal={ () => setActiveModalAction( null ) }
						/>
					) }
				</div>
			) }
		</Stack>
	);

	return (
		<Composite.Row
			ref={ itemRef }
			render={
				/* aria-posinset breaks Composite.Row if passed to it directly. */
				<div
					aria-posinset={ posinset }
					aria-setsize={
						infiniteScrollEnabled
							? paginationInfo.totalItems
							: undefined
					}
				/>
			}
			role={ infiniteScrollEnabled ? 'article' : 'row' }
			className={ clsx( {
				'is-selected': isSelected,
				'is-hovered': isHovered,
			} ) }
			onMouseEnter={ handleHover }
			onMouseLeave={ handleHover }
		>
			<Stack
				direction="row"
				className="dataviews-view-list__item-wrapper"
			>
				<div role="gridcell">
					<Composite.Item
						id={ generateItemWrapperCompositeId( idPrefix ) }
						aria-pressed={ isSelected }
						aria-labelledby={ labelId }
						aria-describedby={ descriptionId }
						className="dataviews-view-list__item"
						{ ...selectionProps }
					/>
				</div>
				<Stack
					direction="row"
					gap="md"
					justify="start"
					align={ hasOnlyMediaAndTitle ? 'center' : 'flex-start' }
					style={ { flex: 1, minWidth: 0 } }
				>
					{ renderedMediaField }
					<Stack
						direction="column"
						gap="xs"
						className="dataviews-view-list__field-wrapper"
					>
						<Stack direction="row" align="center">
							<div
								className="dataviews-title-field dataviews-view-list__title-field"
								id={ labelId }
							>
								{ renderedTitleField }
							</div>
							{ usedActions }
						</Stack>
						{ renderDescription && (
							<div className="dataviews-view-list__field">
								<descriptionField.render
									item={ item }
									field={ descriptionField }
								/>
							</div>
						) }
						<div
							className="dataviews-view-list__fields"
							id={ descriptionId }
						>
							{ otherFields.map( ( field ) => (
								<div
									key={ field.id }
									className="dataviews-view-list__field"
								>
									<VisuallyHidden
										className="dataviews-view-list__field-label"
										render={ <span /> }
									>
										{ field.label }
									</VisuallyHidden>
									<span className="dataviews-view-list__field-value">
										<field.render
											item={ item }
											field={ field }
										/>
									</span>
								</div>
							) ) }
						</div>
					</Stack>
				</Stack>
			</Stack>
		</Composite.Row>
	);
}

function isDefined< T >( item: T | undefined ): item is T {
	return !! item;
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
		className,
		empty,
	} = props;
	const baseId = useInstanceId( ViewList, 'view-list' );
	const isDelayedLoading = useDelayedLoading( !! isLoading );
	const { paginationInfo } = useContext( DataViewsContext );

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

	const { getSelectionProps } = useSelectionProps( {
		data,
		getItemId,
		isItemSelectable: () => true,
		selection,
		onChangeSelection,
		selectionMode: 'single-required',
		shouldSelectOnClick: true,
	} );

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

	const compositeRef = useRef< HTMLDivElement >( null );

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
			// The active composite item is controlled state that
			// can update without needing a focus move (e.g., searching
			// can trigger an active ID update). Only move DOM focus
			// when it's already within the list.
			if (
				compositeRef.current?.contains(
					compositeRef.current.ownerDocument.activeElement
				)
			) {
				document.getElementById( targetCompositeItemId )?.focus();
			}
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
	// dropdown menu trigger on the previous/next row. Runs in the capture
	// phase and stops propagation because the menu's open-on-arrow-key
	// behavior doesn't check whether the event's default was prevented.
	const onDropdownTriggerKeyDown = useCallback(
		( event: React.KeyboardEvent< HTMLButtonElement > ) => {
			if ( event.key === 'ArrowDown' ) {
				// Select the dropdown menu trigger item in the next row.
				event.preventDefault();
				event.stopPropagation();
				selectCompositeItem(
					activeItemIndex + 1,
					generateDropdownTriggerCompositeId
				);
			}
			if ( event.key === 'ArrowUp' ) {
				// Select the dropdown menu trigger item in the previous row.
				event.preventDefault();
				event.stopPropagation();
				selectCompositeItem(
					activeItemIndex - 1,
					generateDropdownTriggerCompositeId
				);
			}
		},
		[ selectCompositeItem, activeItemIndex ]
	);

	const hasData = !! data?.length;
	const groupField = view.groupBy?.field
		? fields.find( ( field ) => field.id === view.groupBy?.field )
		: null;
	const dataByGroup =
		hasData && groupField ? getDataByGroup( data, groupField ) : null;
	const isInfiniteScroll = view.infiniteScrollEnabled && ! dataByGroup;
	// Whether the server has more rows beyond the current window.
	const hasMoreItems =
		isInfiniteScroll &&
		( view.startPosition ?? 1 ) + ( view.perPage ?? 0 ) <
			paginationInfo.totalItems;
	const listClassName = clsx( 'dataviews-view-list', className, {
		[ `has-${ view.layout?.density }-density` ]:
			view.layout?.density &&
			[ 'compact', 'comfortable' ].includes( view.layout.density ),
		'is-refreshing': ! isInfiniteScroll && isDelayedLoading,
	} );
	const compositeProps = {
		ref: compositeRef,
		id: baseId,
		render: <div />,
		activeId: activeCompositeId,
		setActiveId: setActiveCompositeId,
		inert: ! isInfiniteScroll && !! isLoading ? 'true' : undefined,
	};
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

	// Render data grouped by field
	if ( hasData && groupField && dataByGroup ) {
		return (
			<Composite
				{ ...compositeProps }
				className="dataviews-view-list__group"
				role="grid"
			>
				<Stack direction="column" gap="lg" className={ listClassName }>
					{ Array.from( dataByGroup.entries() ).map(
						( [ groupName, groupItems ] ) => (
							<Stack direction="column" key={ groupName }>
								<h3 className="dataviews-view-list__group-header">
									{ view.groupBy?.showLabel === false
										? groupName
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
										<ListItem
											key={ id }
											view={ view }
											idPrefix={ id }
											actions={ actions }
											item={ item }
											isSelected={ item === selectedItem }
											selectionProps={ getSelectionProps(
												getItemId( item )
											) }
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
							</Stack>
						)
					) }
				</Stack>
			</Composite>
		);
	}

	// Render ungrouped data
	return (
		<>
			<Composite
				{ ...compositeProps }
				className={ listClassName }
				role={ view.infiniteScrollEnabled ? 'feed' : 'grid' }
			>
				{ data.map( ( item, index ) => {
					const id = generateCompositeItemIdPrefix( item );
					return (
						<ListItem
							key={ id }
							view={ view }
							idPrefix={ id }
							actions={ actions }
							item={ item }
							isSelected={ item === selectedItem }
							selectionProps={ getSelectionProps(
								getItemId( item )
							) }
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
			{ ( hasMoreItems || ( isInfiniteScroll && isLoading ) ) && (
				// Keep the spinner's height reserved while loading more so the
				// scroll position doesn't bounce. Hidden, and silent to a11y,
				// while idle.
				<p
					className="dataviews-loading-more"
					aria-hidden={ ! isLoading }
				>
					<Spinner />
				</p>
			) }
		</>
	);
}
