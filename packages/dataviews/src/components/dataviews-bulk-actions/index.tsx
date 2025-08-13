/**
 * External dependencies
 */
import type { ReactElement } from 'react';

/**
 * WordPress dependencies
 */
import {
	Button,
	CheckboxControl,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { __, sprintf, _n } from '@wordpress/i18n';
import { useMemo, useState, useRef, useContext } from '@wordpress/element';
import { useRegistry } from '@wordpress/data';
import { closeSmall } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import DataViewsContext from '../dataviews-context';
import { ActionModal } from '../dataviews-item-actions';
import type { Action, ActionModal as ActionModalType } from '../../types';
import type { SetSelection } from '../../private-types';
import type { ActionTriggerProps } from '../dataviews-item-actions';

interface ActionWithModalProps< Item > {
	action: ActionModalType< Item >;
	items: Item[];
	ActionTriggerComponent: (
		props: ActionTriggerProps< Item >
	) => ReactElement;
	isTextButton?: boolean;
}

function ActionWithModal< Item >( {
	action,
	items,
	ActionTriggerComponent,
	isTextButton,
}: ActionWithModalProps< Item > ) {
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const actionTriggerProps = {
		action,
		onClick: () => {
			setIsModalOpen( true );
		},
		items,
		isTextButton,
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

export function useIsMultiselectPicker< Item >(
	picker: boolean,
	actions: Action< Item >[]
) {
	return useMemo( () => {
		if ( ! picker ) {
			return undefined;
		}
		return actions.every( ( action ) => action.supportsBulk );
	}, [ picker, actions ] );
}

interface BulkSelectionCheckboxProps< Item > {
	selection: string[];
	onChangeSelection: SetSelection;
	data: Item[];
	actions: Action< Item >[];
	getItemId: ( item: Item ) => string;
	picker?: boolean;
}

export function BulkSelectionCheckbox< Item >( {
	selection,
	onChangeSelection,
	data,
	actions,
	getItemId,
	picker,
}: BulkSelectionCheckboxProps< Item > ) {
	const isMultiselectPicker = useIsMultiselectPicker(
		Boolean( picker ),
		actions
	);

	const selectableItems = useMemo( () => {
		return data.filter( ( item ) => {
			return actions.some(
				( action ) =>
					action.supportsBulk &&
					( ! action.isEligible || action.isEligible( item ) )
			);
		} );
	}, [ data, actions ] );

	if ( picker && ! isMultiselectPicker ) {
		return;
	}

	const selectedItems = data.filter(
		( item ) =>
			selection.includes( getItemId( item ) ) &&
			selectableItems.includes( item )
	);
	const areAllSelected = selectedItems.length === selectableItems.length;
	return (
		<CheckboxControl
			className="dataviews-view-table-selection-checkbox"
			__nextHasNoMarginBottom
			checked={ areAllSelected }
			indeterminate={ ! areAllSelected && !! selectedItems.length }
			onChange={ () => {
				if ( areAllSelected ) {
					if ( picker ) {
						// In picker mode, selections can span multiple pages.
						// Partially remove the current page from the total selection.
						onChangeSelection(
							selection.filter(
								( id ) =>
									! data.some(
										( item ) => id === getItemId( item )
									)
							)
						);
					} else {
						// Outside of picker mode, remove the entire selection.
						onChangeSelection( [] );
					}
				} else if ( picker ) {
					// When in picker mode, merge the additional selection into the existing selecting
					// to ensure items selected on other pages aren't deselected.
					const selectionSet = new Set( [
						...selection,
						...selectableItems.map( ( item ) => getItemId( item ) ),
					] );
					onChangeSelection( Array.from( selectionSet ) );
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
	selection: string[];
	selectedItems: Item[];
	actionInProgress: string | null;
	setActionInProgress: ( actionId: string | null ) => void;
	picker?: boolean;
}

interface ToolbarContentProps< Item > {
	selection: string[];
	onChangeSelection: SetSelection;
	data: Item[];
	actions: Action< Item >[];
	getItemId: ( item: Item ) => string;
	picker?: boolean;
}

function ActionTrigger< Item >( {
	action,
	onClick,
	isBusy,
	items,
	isTextButton,
}: ActionTriggerProps< Item > ) {
	const label =
		typeof action.label === 'string' ? action.label : action.label( items );
	const textButtonVariant = action.isPrimary ? 'primary' : 'secondary';

	return (
		<Button
			disabled={ isBusy }
			accessibleWhenDisabled
			label={ label }
			text={ isTextButton ? label : undefined }
			icon={ action.icon }
			isDestructive={ action.isDestructive }
			size="compact"
			onClick={ onClick }
			isBusy={ isBusy }
			tooltipPosition={ isTextButton ? undefined : 'top' }
			variant={ isTextButton ? textButtonVariant : undefined }
		/>
	);
}

const EMPTY_ARRAY: [] = [];

function ActionButton< Item >( {
	action,
	selection,
	selectedItems,
	actionInProgress,
	setActionInProgress,
	picker,
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
				isTextButton={ picker }
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
					selection,
				} );
				setActionInProgress( null );
			} }
			items={ selectedEligibleItems }
			isBusy={ actionInProgress === action.id }
			isTextButton={ picker }
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
	picker?: boolean
) {
	// When in picker mode, the selection can span multiple pages,
	// the selectionCount and total are presented differently to
	// reflect that.
	const selectionCount = picker ? selection.length : selectedItems.length;

	const message =
		selectionCount > 0
			? sprintf(
					/* translators: %d: number of items. */
					_n(
						'%d Item selected',
						'%d Items selected',
						selectionCount
					),
					selectionCount
			  )
			: sprintf(
					/* translators: %d: number of items. */
					_n( '%d Item', '%d Items', data.length ),
					data.length
			  );
	return (
		<HStack
			expanded={ false }
			className="dataviews-bulk-actions-footer__container"
			spacing={ 3 }
		>
			<BulkSelectionCheckbox
				selection={ selection }
				onChangeSelection={ onChangeSelection }
				data={ data }
				actions={ actions }
				getItemId={ getItemId }
				picker={ picker }
			/>
			<span className="dataviews-bulk-actions-footer__item-count">
				{ message }
			</span>
			<HStack
				className="dataviews-bulk-actions-footer__action-buttons"
				expanded={ false }
				spacing={ 1 }
			>
				{ actionsToShow.map( ( action ) => {
					return (
						<ActionButton
							key={ action.id }
							action={ action }
							selection={ selection }
							selectedItems={ selectedItems }
							actionInProgress={ actionInProgress }
							setActionInProgress={ setActionInProgress }
							picker={ picker }
						/>
					);
				} ) }
				{ selectionCount > 0 && (
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
			</HStack>
		</HStack>
	);
}

function FooterContent< Item >( {
	selection,
	actions,
	onChangeSelection,
	data,
	getItemId,
	picker,
}: ToolbarContentProps< Item > ) {
	const [ actionInProgress, setActionInProgress ] = useState< string | null >(
		null
	);
	const footerContentRef = useRef< JSX.Element | null >( null );

	const selectableItems = useMemo( () => {
		return data.filter( ( item ) => {
			// When in picker mode, both non-bulk and bulk actions
			// are shown in the footer.
			if ( picker ) {
				return actions.some(
					( action ) =>
						! action.isEligible || action.isEligible( item )
				);
			}

			// When outside of picker mode, only bulk actions are shown.
			return actions.some(
				( action ) =>
					action.supportsBulk &&
					( ! action.isEligible || action.isEligible( item ) )
			);
		} );
	}, [ data, picker, actions ] );

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
				// In picker mode, action.isEligible can't be used since the selected item
				// might be outside of the provided `data`.
				// `icon` and `supportsBulk` are also not requirements.
				if ( picker ) {
					return Boolean( selection.length );
				}

				return (
					action.supportsBulk &&
					action.icon &&
					selectedItems.some(
						( item ) =>
							! action.isEligible || action.isEligible( item )
					)
				);
			} ),
		[ picker, actions, selectedItems, selection ]
	);
	if ( ! actionInProgress ) {
		if ( footerContentRef.current ) {
			footerContentRef.current = null;
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
			picker
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
			picker
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
		picker,
	} = useContext( DataViewsContext );
	return (
		<FooterContent
			selection={ selection }
			onChangeSelection={ onChangeSelection }
			data={ data }
			actions={ actions }
			getItemId={ getItemId }
			picker={ picker }
		/>
	);
}
