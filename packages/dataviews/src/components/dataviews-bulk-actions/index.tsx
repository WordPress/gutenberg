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
	const selectableItems = useMemo( () => {
		return data.filter( ( item ) => {
			return actions.some(
				( action ) =>
					action.supportsBulk &&
					( ! action.isEligible || action.isEligible( item ) )
			);
		} );
	}, [ data, actions ] );

	// Selected items are those in the selection array
	const selectedItems = selectableItems.filter( ( item ) => {
		return selection.includes( getItemId( item ) );
	} );

	// All are selected if all selectable items are in selection
	const areAllSelected =
		selectableItems.length > 0 &&
		selectedItems.length === selectableItems.length;

	// Has selection if any items are selected
	const hasSelection = selectedItems.length > 0;

	return (
		<CheckboxControl
			className="dataviews-view-table-selection-checkbox"
			checked={ areAllSelected }
			indeterminate={ ! areAllSelected && hasSelection }
			onChange={ () => {
				if ( areAllSelected ) {
					// Deselect all - clear entire selection
					onChangeSelection( EMPTY_ARRAY );
				} else {
					// Select all - merge loaded selectable items into selection
					const selectionSet = new Set( [
						...selection,
						...selectableItems.map( ( item ) => getItemId( item ) ),
					] );
					onChangeSelection( Array.from( selectionSet ) );
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
	onlyTotalCount?: boolean
) {
	// For bulk actions, use selectedItems.length (actual loaded items) instead of selection.length
	// This accurately reflects items available for bulk actions
	const message = getFooterMessage(
		selectedItems.length,
		data.length,
		paginationInfo.totalItems,
		onlyTotalCount
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
	const { view } = useContext( DataViewsContext );
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
		selectableFilter
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
			view.infiniteScrollEnabled // onlyTotalCount
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
			view.infiniteScrollEnabled // onlyTotalCount
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
