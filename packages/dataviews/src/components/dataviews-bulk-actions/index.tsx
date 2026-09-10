import {
	Button,
	CheckboxControl,
	DropdownMenu,
	MenuItem,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useMemo, useState, useContext } from '@wordpress/element';
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
	onAction: ( action: Action< Item >, items: Item[] ) => void;
	onClose?: () => void;
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
	onAction,
	onClose,
}: ActionButtonProps< Item > ) {
	const selectedEligibleItems = useMemo(
		() =>
			selectedItems.filter(
				( item ) => ! action.isEligible || action.isEligible( item )
			),
		[ action, selectedItems ]
	);
	const onClick = () => {
		onClose?.();
		onAction( action, selectedEligibleItems );
	};
	const isBusy = actionInProgress === action.id;
	if ( onClose ) {
		return (
			<MenuItem onClick={ onClick } disabled={ isBusy }>
				{ typeof action.label === 'string'
					? action.label
					: action.label( selectedEligibleItems ) }
			</MenuItem>
		);
	}
	return (
		<ActionTrigger
			action={ action }
			onClick={ onClick }
			items={ selectedEligibleItems }
			isBusy={ isBusy }
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
	onAction: ( action: Action< Item >, items: Item[] ) => void,
	onChangeSelection: SetSelection,
	bulkActionsInLayout: boolean,
	totalItems: number,
	isMobile: boolean
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
	const renderActions = ( onClose?: () => void ) =>
		actionsToShow.map( ( action ) => (
			<ActionButton
				key={ action.id }
				action={ action }
				selectedItems={ selectedItems }
				actionInProgress={ actionInProgress }
				onAction={ onAction }
				onClose={ onClose }
			/>
		) );
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
			{ ( ! bulkActionsInLayout || !! selection.length ) && (
				<span className="dataviews-bulk-actions-footer__item-count">
					{ getFooterMessage(
						selection.length,
						data.length,
						totalItems,
						isInfiniteScroll
					) }
				</span>
			) }
			{ bulkActionsInLayout && ! selection.length && (
				<BulkActionsLabel />
			) }
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
				{ bulkActionsInLayout && isMobile
					? actionsToShow.length > 0 && (
							<DropdownMenu
								label={ __( 'Actions' ) }
								text={ __( 'Actions' ) }
								icon={ chevronDown }
								toggleProps={ {
									variant: 'secondary',
									size: 'compact',
									iconPosition: 'right',
									className: 'dataviews-bulk-actions__action',
									disabled: !! actionInProgress,
									isBusy: !! actionInProgress,
									accessibleWhenDisabled: true,
								} }
							>
								{ ( { onClose } ) => renderActions( onClose ) }
							</DropdownMenu>
					  )
					: renderActions() }
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
	const [ pendingContent, setPendingContent ] =
		useState< React.JSX.Element >();
	const registry = useRegistry();
	const [ activeModal, setActiveModal ] = useState< {
		action: ActionModalType< Item >;
		items: Item[];
	} | null >( null );
	const onAction = async ( action: Action< Item >, items: Item[] ) => {
		if ( 'RenderModal' in action ) {
			setActiveModal( { action, items } );
			return;
		}
		setPendingContent( renderContent( action.id ) );
		try {
			await action.callback( items, { registry } );
		} finally {
			setPendingContent( undefined );
		}
	};
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
					( ! isMobile || bulkActionsInLayout || action.icon ) &&
					selectedItems.some(
						( item ) =>
							! action.isEligible || action.isEligible( item )
					)
				);
			} ),
		[ actions, selectedItems, isMobile, bulkActionsInLayout ]
	);
	const renderContent = ( actionInProgress: string | null ) =>
		renderBulkActionsContent(
			data,
			actions,
			getItemId,
			isInfiniteScroll,
			selection,
			actionsToShow,
			selectedItems,
			actionInProgress,
			onAction,
			onChangeSelection,
			bulkActionsInLayout,
			paginationInfo.totalItems,
			isMobile
		);
	return (
		<>
			{ pendingContent ?? renderContent( null ) }
			{ activeModal && (
				<ActionModal
					action={ activeModal.action }
					items={ activeModal.items }
					closeModal={ () => setActiveModal( null ) }
				/>
			) }
		</>
	);
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
