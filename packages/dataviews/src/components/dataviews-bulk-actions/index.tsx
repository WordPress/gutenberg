/**
 * External dependencies
 */
import type { ReactElement } from 'react';

/**
 * WordPress dependencies
 */
import { Button, CheckboxControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import {
	useMemo,
	useState,
	useRef,
	useContext,
	useCallback,
} from '@wordpress/element';
import { useRegistry } from '@wordpress/data';
import { closeSmall } from '@wordpress/icons';
import { useViewportMatch } from '@wordpress/compose';
import { Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import DataViewsContext from '../dataviews-context';
import { ActionModal } from '../dataviews-item-actions';
import type { Action, ActionModal as ActionModalType } from '../../types';
import type { SetSelection } from '../../types/private';
import type { ActionTriggerProps } from '../dataviews-item-actions';
import getFooterMessage from '../../utils/get-footer-message';
import useSelectedItems from '../../hooks/use-selected-items';

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

export function useHasAPossibleBulkAction< Item >(
	actions: Action< Item >[],
	item: Item
) {
	return useMemo( () => {
		return actions.some( ( action ) => {
			return (
				action.supportsBulk &&
				( ! action.isEligible || action.isEligible( item ) )
			);
		} );
	}, [ actions, item ] );
}

export function useSomeItemHasAPossibleBulkAction< Item >(
	actions: Action< Item >[],
	data: Item[]
) {
	return useMemo( () => {
		return data.some( ( item ) => {
			return actions.some( ( action ) => {
				return (
					action.supportsBulk &&
					( ! action.isEligible || action.isEligible( item ) )
				);
			} );
		} );
	}, [ actions, data ] );
}

interface BulkSelectionCheckboxProps< Item > {
	selection: string[];
	onChangeSelection: SetSelection;
	data: Item[];
	actions: Action< Item >[];
	getItemId: ( item: Item ) => string;
}

export function BulkSelectionCheckbox< Item >( {
	selection,
	onChangeSelection,
	data,
	actions,
	getItemId,
}: BulkSelectionCheckboxProps< Item > ) {
	const { view, isSelectAllMode, setIsSelectAllMode } =
		useContext( DataViewsContext );
	const selectableItems = useMemo( () => {
		return data.filter( ( item ) => {
			return actions.some(
				( action ) =>
					action.supportsBulk &&
					( ! action.isEligible || action.isEligible( item ) )
			);
		} );
	}, [ data, actions ] );

	// Calculate selected items based on mode
	// In select all mode: selection is a deselection list, so selected = NOT in array
	// In normal mode: selected = IN array
	const selectedItems = selectableItems.filter( ( item ) => {
		const isInArray = selection.includes( getItemId( item ) );
		return isSelectAllMode ? ! isInArray : isInArray;
	} );

	// In select all mode, all are selected if deselection list is empty
	// In normal mode, all are selected if all selectable items are in selection
	const areAllSelected = isSelectAllMode
		? selection.length === 0
		: selectedItems.length === selectableItems.length;

	// Determine if there's any selection
	// In select all mode: has selection if deselection list doesn't include all items
	// In normal mode: has selection if any items are selected
	const hasSelection = isSelectAllMode
		? selection.length < selectableItems.length // Some items still selected
		: selectedItems.length > 0;

	return (
		<CheckboxControl
			className="dataviews-view-table-selection-checkbox"
			checked={ areAllSelected }
			indeterminate={ ! areAllSelected && hasSelection }
			onChange={ () => {
				if ( view.infiniteScrollEnabled ) {
					// For infinite scroll, toggle isSelectAllMode
					if ( isSelectAllMode ) {
						if ( areAllSelected ) {
							// All are selected, deselect all: disable select all mode
							setIsSelectAllMode( false );
							onChangeSelection( [] );
						} else {
							// Some items were manually deselected, re-select all by clearing deselection list
							onChangeSelection( [] );
						}
					} else {
						// Select all: enable select all mode with empty deselection list
						setIsSelectAllMode( true );
						onChangeSelection( [] );
					}
				} else if ( areAllSelected ) {
					// Standard pagination behavior: deselect all
					onChangeSelection( [] );
				} else {
					// Standard pagination behavior: select all
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
	paginationInfo: {
		totalItems: number;
		totalPages: number;
	};
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

	if ( isMobile ) {
		return (
			<Button
				disabled={ isBusy }
				accessibleWhenDisabled
				label={ label }
				icon={ action.icon }
				size="compact"
				onClick={ onClick }
				isBusy={ isBusy }
			/>
		);
	}

	return (
		<Button
			disabled={ isBusy }
			accessibleWhenDisabled
			size="compact"
			onClick={ onClick }
			isBusy={ isBusy }
		>
			{ label }
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
				await action.callback( selectedItems, {
					registry,
				} );
				setActionInProgress( null );
			} }
			items={ selectedEligibleItems }
			isBusy={ actionInProgress === action.id }
		/>
	);
}

function renderFooterContent< Item >(
	data: Item[],
	actions: Action< Item >[],
	getItemId: ( item: Item ) => string,
	selection: string[],
	actionsToShow: Action< Item >[],
	selectedItems: Item[],
	actionInProgress: string | null,
	setActionInProgress: ( actionId: string | null ) => void,
	onChangeSelection: SetSelection,
	paginationInfo: {
		totalItems: number;
		totalPages: number;
	},
	onlyTotalCount?: boolean,
	isSelectAllMode?: boolean
) {
	const message = getFooterMessage(
		selection.length,
		data.length,
		paginationInfo.totalItems,
		onlyTotalCount,
		isSelectAllMode
	);
	return (
		<Stack
			direction="row"
			className="dataviews-bulk-actions-footer__container"
			gap="md"
			align="center"
		>
			<BulkSelectionCheckbox
				selection={ selection }
				onChangeSelection={ onChangeSelection }
				data={ data }
				actions={ actions }
				getItemId={ getItemId }
			/>
			<span className="dataviews-bulk-actions-footer__item-count">
				{ message }
			</span>
			<Stack
				direction="row"
				className="dataviews-bulk-actions-footer__action-buttons"
				gap="xs"
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
				{ selectedItems.length > 0 && (
					<Button
						icon={ closeSmall }
						showTooltip
						tooltipPosition="top"
						size="compact"
						label={ __( 'Cancel' ) }
						disabled={ !! actionInProgress }
						accessibleWhenDisabled={ false }
						onClick={ () => {
							onChangeSelection( EMPTY_ARRAY );
						} }
					/>
				) }
			</Stack>
		</Stack>
	);
}

function FooterContent< Item >( {
	selection,
	actions,
	onChangeSelection,
	data,
	getItemId,
	paginationInfo,
}: ToolbarContentProps< Item > ) {
	const { view, isSelectAllMode } = useContext( DataViewsContext );
	const [ actionInProgress, setActionInProgress ] = useState< string | null >(
		null
	);
	const footerContentRef = useRef< React.JSX.Element >( undefined );
	const isMobile = useViewportMatch( 'medium', '<' );

	const bulkActions = useMemo(
		() => actions.filter( ( action ) => action.supportsBulk ),
		[ actions ]
	);

	// Create a filter function to check if an item is selectable (eligible for at least one bulk action)
	const selectableFilter = useCallback(
		( item: Item ) =>
			bulkActions.some(
				( action ) => ! action.isEligible || action.isEligible( item )
			),
		[ bulkActions ]
	);

	const selectedItems = useSelectedItems(
		view,
		data,
		selection,
		getItemId,
		selectableFilter,
		isSelectAllMode
	);

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
		if ( footerContentRef.current ) {
			footerContentRef.current = undefined;
		}
		return renderFooterContent(
			data,
			actions,
			getItemId,
			selection,
			actionsToShow,
			selectedItems,
			actionInProgress,
			setActionInProgress,
			onChangeSelection,
			paginationInfo,
			view.infiniteScrollEnabled, // onlyTotalCount
			isSelectAllMode
		);
	} else if ( ! footerContentRef.current ) {
		footerContentRef.current = renderFooterContent(
			data,
			actions,
			getItemId,
			selection,
			actionsToShow,
			selectedItems,
			actionInProgress,
			setActionInProgress,
			onChangeSelection,
			paginationInfo,
			view.infiniteScrollEnabled, // onlyTotalCount
			isSelectAllMode
		);
	}
	return footerContentRef.current;
}

export function BulkActionsFooter() {
	const {
		data,
		selection,
		actions = EMPTY_ARRAY,
		onChangeSelection,
		getItemId,
		paginationInfo,
	} = useContext( DataViewsContext );
	return (
		<FooterContent
			selection={ selection }
			onChangeSelection={ onChangeSelection }
			data={ data }
			actions={ actions }
			getItemId={ getItemId }
			paginationInfo={ paginationInfo }
		/>
	);
}
