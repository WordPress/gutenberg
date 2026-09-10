import type { ReactElement } from 'react';
import { Button, CheckboxControl, DropdownMenu } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useMemo, useState, useRef, useContext } from '@wordpress/element';
import { useRegistry } from '@wordpress/data';
import { closeSmall, chevronDown } from '@wordpress/icons';
import { useViewportMatch } from '@wordpress/compose';
import { Stack } from '@wordpress/ui';
import DataViewsContext from '../dataviews-context';
import { ActionModal } from '../dataviews-item-actions';
import type { Action, ActionModal as ActionModalType } from '../../types';
import type { SetSelection } from '../../types/private';
import type { ActionTriggerProps } from '../dataviews-item-actions';
import getFooterMessage from '../../utils/get-footer-message';

interface ActionWithModalProps< Item > {
	action: ActionModalType< Item >;
	items: Item[];
	ActionTriggerComponent: (
		props: ActionTriggerProps< Item >
	) => ReactElement;
}

function ActionWithModal< Item >( {
	action,
	items,
	ActionTriggerComponent,
}: ActionWithModalProps< Item > ) {
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const actionTriggerProps = {
		action,
		onClick: () => {
			setIsModalOpen( true );
		},
		items,
	};
	return (
		<>
			<ActionTriggerComponent { ...actionTriggerProps } />
			{ isModalOpen && (
				<ActionModal
					action={ action }
					items={ items }
					closeModal={ () => setIsModalOpen( false ) }
				/>
			) }
		</>
	);
}

export function hasAPossibleBulkAction< Item >(
	actions: Action< Item >[],
	item: Item
) {
	return actions.some(
		( action ) =>
			action.supportsBulk &&
			( ! action.isEligible || action.isEligible( item ) )
	);
}

export function useHasAPossibleBulkAction< Item >(
	actions: Action< Item >[],
	item: Item
) {
	return useMemo(
		() => hasAPossibleBulkAction( actions, item ),
		[ actions, item ]
	);
}

export function useSomeItemHasAPossibleBulkAction< Item >(
	actions: Action< Item >[],
	data: Item[]
) {
	return useMemo(
		() => data.some( ( item ) => hasAPossibleBulkAction( actions, item ) ),
		[ actions, data ]
	);
}

interface BulkSelectionCheckboxProps< Item > {
	selection: string[];
	onChangeSelection: SetSelection;
	data: Item[];
	actions: Action< Item >[];
	getItemId: ( item: Item ) => string;
	disableSelectAll?: boolean;
}

export function BulkSelectionCheckbox< Item >( {
	selection,
	onChangeSelection,
	data,
	actions,
	getItemId,
	disableSelectAll = false,
}: BulkSelectionCheckboxProps< Item > ) {
	const selectableItems = useMemo( () => {
		return data.filter( ( item ) => {
			return actions.some(
				( action ) =>
					action.supportsBulk &&
					( ! action.isEligible || action.isEligible( item ) )
			);
		} );
	}, [ data, actions ] );
	const selectedItems = data.filter(
		( item ) =>
			selection.includes( getItemId( item ) ) &&
			selectableItems.includes( item )
	);
	const hasSelection = selection.length > 0;
	const areAllSelected = selectedItems.length === selectableItems.length;

	if ( disableSelectAll ) {
		return (
			<CheckboxControl
				className="dataviews-view-table-selection-checkbox"
				checked={ hasSelection }
				disabled={ ! hasSelection }
				onChange={ () => {
					onChangeSelection( [] );
				} }
				aria-label={ __( 'Deselect all' ) }
			/>
		);
	}

	return (
		<CheckboxControl
			className="dataviews-view-table-selection-checkbox"
			checked={ areAllSelected }
			indeterminate={ ! areAllSelected && !! selectedItems.length }
			onChange={ () => {
				if ( areAllSelected ) {
					onChangeSelection( [] );
				} else {
					onChangeSelection(
						selectableItems.map( ( item ) => getItemId( item ) )
					);
				}
			} }
			aria-label={
				areAllSelected ? __( 'Deselect all' ) : __( 'Select all' )
			}
		/>
	);
}

interface ActionButtonProps< Item > {
	action: Action< Item >;
	selectedItems: Item[];
	actionInProgress: string | null;
	setActionInProgress: ( actionId: string | null ) => void;
}

interface ToolbarContentProps< Item > {
	selection: string[];
	onChangeSelection: SetSelection;
	data: Item[];
	actions: Action< Item >[];
	getItemId: ( item: Item ) => string;
	isInfiniteScroll: boolean;
}

function ActionTrigger< Item >( {
	action,
	onClick,
	isBusy,
	items,
}: ActionTriggerProps< Item > ) {
	const { bulkActionsInLayout } = useContext( DataViewsContext );
	const label =
		typeof action.label === 'string' ? action.label : action.label( items );
	const isMobile = useViewportMatch( 'medium', '<' );

	return (
		<Button
			variant={ bulkActionsInLayout ? 'secondary' : undefined }
			className={
				bulkActionsInLayout
					? 'dataviews-bulk-actions__action'
					: undefined
			}
			disabled={ isBusy }
			accessibleWhenDisabled
			label={ isMobile ? label : undefined }
			icon={ isMobile ? action.icon : undefined }
			size="compact"
			onClick={ onClick }
			isBusy={ isBusy }
		>
			{ ! isMobile && label }
		</Button>
	);
}

const EMPTY_ARRAY: [] = [];

function ActionButton< Item >( {
	action,
	selectedItems,
	actionInProgress,
	setActionInProgress,
}: ActionButtonProps< Item > ) {
	const registry = useRegistry();
	const selectedEligibleItems = useMemo( () => {
		return selectedItems.filter( ( item ) => {
			return ! action.isEligible || action.isEligible( item );
		} );
	}, [ action, selectedItems ] );
	if ( 'RenderModal' in action ) {
		return (
			<ActionWithModal
				key={ action.id }
				action={ action }
				items={ selectedEligibleItems }
				ActionTriggerComponent={ ActionTrigger }
			/>
		);
	}
	return (
		<ActionTrigger
			key={ action.id }
			action={ action }
			onClick={ async () => {
				setActionInProgress( action.id );
				await action.callback( selectedEligibleItems, {
					registry,
				} );
				setActionInProgress( null );
			} }
			items={ selectedEligibleItems }
			isBusy={ actionInProgress === action.id }
		/>
	);
}

function renderBulkActionsContent< Item >(
	data: Item[],
	actions: Action< Item >[],
	getItemId: ( item: Item ) => string,
	isInfiniteScroll: boolean,
	selection: string[],
	actionsToShow: Action< Item >[],
	selectedItems: Item[],
	actionInProgress: string | null,
	setActionInProgress: ( actionId: string | null ) => void,
	onChangeSelection: SetSelection,
	bulkActionsInLayout: boolean,
	totalItems: number
) {
	const clearSelection = selectedItems.length > 0 && (
		<Button
			className={
				bulkActionsInLayout
					? 'dataviews-bulk-actions__clear'
					: undefined
			}
			icon={ closeSmall }
			showTooltip
			tooltipPosition="top"
			size="compact"
			label={ __( 'Cancel' ) }
			disabled={ !! actionInProgress }
			accessibleWhenDisabled={ false }
			onClick={ () => onChangeSelection( EMPTY_ARRAY ) }
		/>
	);
	return (
		<Stack
			direction="row"
			className={
				bulkActionsInLayout
					? 'dataviews-bulk-actions'
					: 'dataviews-bulk-actions-footer__container'
			}
			gap="md"
			align="center"
			justify="start"
		>
			<BulkSelectionCheckbox
				selection={ selection }
				onChangeSelection={ onChangeSelection }
				data={ data }
				actions={ actions }
				getItemId={ getItemId }
				disableSelectAll={ isInfiniteScroll }
			/>
			{ ! bulkActionsInLayout && (
				<span className="dataviews-bulk-actions-footer__item-count">
					{ getFooterMessage(
						selection.length,
						data.length,
						totalItems,
						isInfiniteScroll
					) }
				</span>
			) }
			{ bulkActionsInLayout &&
				( selection.length ? (
					<BulkSelectionDropdown />
				) : (
					<BulkActionsLabel />
				) ) }
			<Stack
				direction="row"
				className={
					bulkActionsInLayout
						? 'dataviews-bulk-actions__buttons'
						: 'dataviews-bulk-actions-footer__action-buttons'
				}
				gap={ bulkActionsInLayout ? 'md' : 'xs' }
				justify="start"
			>
				{ actionsToShow.map( ( action ) => {
					return (
						<ActionButton
							key={ action.id }
							action={ action }
							selectedItems={ selectedItems }
							actionInProgress={ actionInProgress }
							setActionInProgress={ setActionInProgress }
						/>
					);
				} ) }
				{ ! bulkActionsInLayout && clearSelection }
			</Stack>
			{ bulkActionsInLayout && clearSelection }
		</Stack>
	);
}

function BulkActionsContent< Item >( {
	selection,
	actions,
	onChangeSelection,
	data,
	getItemId,
	isInfiniteScroll,
}: ToolbarContentProps< Item > ) {
	const { bulkActionsInLayout = false, paginationInfo } =
		useContext( DataViewsContext );
	const [ actionInProgress, setActionInProgress ] = useState< string | null >(
		null
	);
	const bulkActionsContentRef = useRef< React.JSX.Element >( undefined );
	const isMobile = useViewportMatch( 'medium', '<' );

	const bulkActions = useMemo(
		() => actions.filter( ( action ) => action.supportsBulk ),
		[ actions ]
	);
	const selectableItems = useMemo( () => {
		return data.filter( ( item ) => {
			return bulkActions.some(
				( action ) => ! action.isEligible || action.isEligible( item )
			);
		} );
	}, [ data, bulkActions ] );

	const selectedItems = useMemo( () => {
		return data.filter(
			( item ) =>
				selection.includes( getItemId( item ) ) &&
				selectableItems.includes( item )
		);
	}, [ selection, data, getItemId, selectableItems ] );

	const actionsToShow = useMemo(
		() =>
			actions.filter( ( action ) => {
				return (
					action.supportsBulk &&
					( ! isMobile || action.icon ) &&
					selectedItems.some(
						( item ) =>
							! action.isEligible || action.isEligible( item )
					)
				);
			} ),
		[ actions, selectedItems, isMobile ]
	);
	if ( ! actionInProgress ) {
		if ( bulkActionsContentRef.current ) {
			bulkActionsContentRef.current = undefined;
		}
		return renderBulkActionsContent(
			data,
			actions,
			getItemId,
			isInfiniteScroll,
			selection,
			actionsToShow,
			selectedItems,
			actionInProgress,
			setActionInProgress,
			onChangeSelection,
			bulkActionsInLayout,
			paginationInfo.totalItems
		);
	} else if ( ! bulkActionsContentRef.current ) {
		bulkActionsContentRef.current = renderBulkActionsContent(
			data,
			actions,
			getItemId,
			isInfiniteScroll,
			selection,
			actionsToShow,
			selectedItems,
			actionInProgress,
			setActionInProgress,
			onChangeSelection,
			bulkActionsInLayout,
			paginationInfo.totalItems
		);
	}
	return bulkActionsContentRef.current;
}

export function BulkActions() {
	const {
		data,
		selection,
		actions = EMPTY_ARRAY,
		onChangeSelection,
		getItemId,
		view,
	} = useContext( DataViewsContext );
	return (
		<BulkActionsContent
			selection={ selection }
			onChangeSelection={ onChangeSelection }
			data={ data }
			actions={ actions }
			getItemId={ getItemId }
			isInfiniteScroll={ !! view.infiniteScrollEnabled }
		/>
	);
}

function BulkActionsLabel() {
	const { fields, view } = useContext( DataViewsContext );
	return (
		<span>
			{ fields.find( ( field ) => field.id === view.titleField )?.label ??
				__( 'Items' ) }
		</span>
	);
}

function BulkSelectionDropdown() {
	const {
		data,
		actions = EMPTY_ARRAY,
		selection,
		onChangeSelection,
		getItemId,
		view,
	} = useContext( DataViewsContext );
	const remainingIds = data
		.filter(
			( item ) =>
				hasAPossibleBulkAction( actions, item ) &&
				! selection.includes( getItemId( item ) )
		)
		.map( getItemId );
	return (
		<DropdownMenu
			icon={ chevronDown }
			label={ __( 'Selection options' ) }
			text={ getFooterMessage(
				selection.length,
				data.length,
				data.length
			) }
			toggleProps={ {
				size: 'compact',
				iconPosition: 'right',
				iconSize: 16,
				showTooltip: false,
				className: 'dataviews-bulk-actions__selection-toggle',
			} }
			controls={ [
				{
					title: __( 'Deselect all' ),
					isDisabled: ! selection.length,
					onClick: () => onChangeSelection( [] ),
				},
				...( view.infiniteScrollEnabled
					? []
					: [
							{
								title: __( 'Select remaining on this page' ),
								isDisabled: ! remainingIds.length,
								onClick: () =>
									onChangeSelection( [
										...selection,
										...remainingIds,
									] ),
							},
					  ] ),
			] }
		/>
	);
}
