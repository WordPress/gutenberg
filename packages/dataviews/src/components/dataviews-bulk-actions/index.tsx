import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useMemo, useState, useContext } from '@wordpress/element';
import { useRegistry } from '@wordpress/data';
import { closeSmall, chevronDown } from '@wordpress/icons';
import { useViewportMatch } from '@wordpress/compose';
// eslint-disable-next-line @wordpress/use-recommended-components -- Intentional early adoption of Checkbox and Menu, pending WordPress/gutenberg#76135.
import { Checkbox, Menu, Stack } from '@wordpress/ui';
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
	checkboxRef?: React.Ref< HTMLSpanElement >;
}

export function BulkSelectionCheckbox< Item >( {
	selection,
	onChangeSelection,
	data,
	actions,
	getItemId,
	disableSelectAll = false,
	checkboxRef,
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
			<Checkbox
				ref={ checkboxRef }
				checked={ hasSelection }
				disabled={ ! hasSelection }
				onCheckedChange={ () => onChangeSelection( [] ) }
				aria-label={ __( 'Deselect all' ) }
			/>
		);
	}

	return (
		<Checkbox
			ref={ checkboxRef }
			checked={ areAllSelected }
			indeterminate={ ! areAllSelected && !! selectedItems.length }
			onCheckedChange={ () => {
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
	isMenuItem?: boolean;
}

interface ToolbarContentProps< Item > {
	selection: string[];
	onChangeSelection: SetSelection;
	data: Item[];
	actions: Action< Item >[];
	getItemId: ( item: Item ) => string;
	isInfiniteScroll: boolean;
	selectionCheckboxRef?: React.Ref< HTMLSpanElement >;
	onActionInProgressChange?: ( inProgress: boolean ) => void;
}

function ActionTrigger< Item >( {
	action,
	onClick,
	isBusy,
	items,
}: ActionTriggerProps< Item > ) {
	const label =
		typeof action.label === 'string' ? action.label : action.label( items );
	const isMobile = useViewportMatch( 'medium', '<' );

	return (
		<Button
			variant="secondary"
			className="dataviews-bulk-actions__action"
			disabled={ !! action.disabled || isBusy }
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
	isMenuItem,
}: ActionButtonProps< Item > ) {
	const selectedEligibleItems = useMemo(
		() =>
			selectedItems.filter(
				( item ) => ! action.isEligible || action.isEligible( item )
			),
		[ action, selectedItems ]
	);
	const onClick = () => {
		onAction( action, selectedEligibleItems );
	};
	const isBusy = actionInProgress === action.id;
	if ( isMenuItem ) {
		return (
			<Menu.Item
				onClick={ onClick }
				disabled={ !! action.disabled || isBusy }
			>
				<Menu.ItemLabel>
					{ typeof action.label === 'string'
						? action.label
						: action.label( selectedEligibleItems ) }
				</Menu.ItemLabel>
			</Menu.Item>
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
	totalItems: number,
	isMobile: boolean,
	selectionCheckboxRef?: React.Ref< HTMLSpanElement >
) {
	const clearSelection = selectedItems.length > 0 && (
		<Button
			className="dataviews-bulk-actions__clear"
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
	const renderActions = ( isMenuItem = false ) =>
		actionsToShow.map( ( action ) => (
			<ActionButton
				key={ action.id }
				action={ action }
				selectedItems={ selectedItems }
				actionInProgress={ actionInProgress }
				onAction={ onAction }
				isMenuItem={ isMenuItem }
			/>
		) );
	return (
		<Stack
			direction="row"
			className="dataviews-bulk-actions"
			gap="md"
			align="center"
			justify="start"
		>
			<BulkSelectionCheckbox
				checkboxRef={ selectionCheckboxRef }
				selection={ selection }
				onChangeSelection={ onChangeSelection }
				data={ data }
				actions={ actions }
				getItemId={ getItemId }
				disableSelectAll={ isInfiniteScroll }
			/>
			{ !! selection.length && (
				<span className="dataviews-bulk-actions-footer__item-count">
					{ getFooterMessage(
						selection.length,
						data.length,
						totalItems,
						isInfiniteScroll
					) }
				</span>
			) }
			<Stack direction="row" gap="md" justify="start">
				{ isMobile
					? actionsToShow.length > 0 && (
							<Menu.Root>
								<Menu.Trigger
									disabled={ !! actionInProgress }
									render={
										<Button
											variant="secondary"
											size="compact"
											icon={ chevronDown }
											iconPosition="right"
											className="dataviews-bulk-actions__action"
											isBusy={ !! actionInProgress }
											accessibleWhenDisabled
										>
											{ __( 'Actions' ) }
										</Button>
									}
								/>
								<Menu.Popup>
									<Menu.Group>
										{ renderActions( true ) }
									</Menu.Group>
								</Menu.Popup>
							</Menu.Root>
						)
					: renderActions() }
			</Stack>
			{ clearSelection }
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
	selectionCheckboxRef,
	onActionInProgressChange,
}: ToolbarContentProps< Item > ) {
	const { paginationInfo } = useContext( DataViewsContext );
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
		onActionInProgressChange?.( true );
		try {
			await action.callback( items, { registry } );
		} finally {
			setPendingContent( undefined );
			onActionInProgressChange?.( false );
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
					selectedItems.some(
						( item ) =>
							! action.isEligible || action.isEligible( item )
					)
				);
			} ),
		[ actions, selectedItems ]
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
			paginationInfo.totalItems,
			isMobile,
			selectionCheckboxRef
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

interface BulkActionToolbarProps {
	selectionCheckboxRef?: React.Ref< HTMLSpanElement >;
	onActionInProgressChange?: ( inProgress: boolean ) => void;
}

export function BulkActionToolbar( {
	selectionCheckboxRef,
	onActionInProgressChange,
}: BulkActionToolbarProps = {} ) {
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
			selectionCheckboxRef={ selectionCheckboxRef }
			onActionInProgressChange={ onActionInProgressChange }
			selection={ selection }
			onChangeSelection={ onChangeSelection }
			data={ data }
			actions={ actions }
			getItemId={ getItemId }
			isInfiniteScroll={ !! view.infiniteScrollEnabled }
		/>
	);
}
