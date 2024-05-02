/**
 * WordPress dependencies
 */
import {
	ToolbarButton,
	Toolbar,
	ToolbarGroup,
	__unstableMotion as motion,
	__unstableAnimatePresence as AnimatePresence,
} from '@wordpress/components';
import { useMemo, useState, useRef } from '@wordpress/element';
import { _n, sprintf, __ } from '@wordpress/i18n';
import { closeSmall } from '@wordpress/icons';
import { useReducedMotion } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { ActionWithModal } from './item-actions';

const SNACKBAR_VARIANTS = {
	init: {
		bottom: -48,
	},
	open: {
		bottom: 24,
		transition: {
			bottom: { type: 'tween', duration: 0.2, ease: [ 0, 0, 0.2, 1 ] },
		},
	},
	exit: {
		opacity: 0,
		bottom: 24,
		transition: {
			opacity: { type: 'tween', duration: 0.2, ease: [ 0, 0, 0.2, 1 ] },
		},
	},
};

function ActionTrigger( { action, onClick, isBusy } ) {
	return (
		<ToolbarButton
			disabled={ isBusy }
			label={ action.label }
			icon={ action.icon }
			isDestructive={ action.isDestructive }
			size="compact"
			onClick={ onClick }
			isBusy={ isBusy }
			isDisabled={ isBusy }
		/>
	);
}

const EMPTY_ARRAY = [];

function ActionButton( {
	action,
	selectedItems,
	actionInProgress,
	setActionInProgress,
} ) {
	const selectedEligibleItems = useMemo( () => {
		return selectedItems.filter( ( item ) => {
			return action.isEligible( item );
		} );
	}, [ action, selectedItems ] );
	if ( !! action.RenderModal ) {
		return (
			<ActionWithModal
				key={ action.id }
				action={ action }
				items={ selectedEligibleItems }
				ActionTrigger={ ActionTrigger }
				onActionStart={ () => {
					setActionInProgress( action.id );
				} }
				onActionPerformed={ () => {
					setActionInProgress( null );
				} }
			/>
		);
	}
	return (
		<ActionTrigger
			key={ action.id }
			action={ action }
			items={ selectedItems }
			onClick={ () => {
				setActionInProgress( action.id );
				action.callback( selectedItems, () => {
					setActionInProgress( action.id );
				} );
			} }
			isBusy={ actionInProgress === action.id }
		/>
	);
}

function renderToolbarContent(
	selection,
	actionsToShow,
	selectedItems,
	actionInProgress,
	setActionInProgress,
	setSelection
) {
	return (
		<>
			<ToolbarGroup>
				<div className="dataviews-bulk-actions__selection-count">
					{ selection.length === 1
						? __( '1 item selected' )
						: sprintf(
								// translators: %s: Total number of selected items.
								_n(
									'%s item selected',
									'%s items selected',
									selection.length
								),
								selection.length
						  ) }
				</div>
			</ToolbarGroup>
			<ToolbarGroup>
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
			</ToolbarGroup>
			<ToolbarGroup>
				<ToolbarButton
					icon={ closeSmall }
					showTooltip
					label={ __( 'Cancel' ) }
					isDisabled={ !! actionInProgress }
					onClick={ () => {
						setSelection( EMPTY_ARRAY );
					} }
				/>
			</ToolbarGroup>
		</>
	);
}

function ToolbarContent( {
	selection,
	actionsToShow,
	selectedItems,
	setSelection,
} ) {
	const [ actionInProgress, setActionInProgress ] = useState( null );
	const buttons = useRef( null );
	if ( ! actionInProgress ) {
		if ( buttons.current ) {
			buttons.current = null;
		}
		return renderToolbarContent(
			selection,
			actionsToShow,
			selectedItems,
			actionInProgress,
			setActionInProgress,
			setSelection
		);
	} else if ( ! buttons.current ) {
		buttons.current = renderToolbarContent(
			selection,
			actionsToShow,
			selectedItems,
			actionInProgress,
			setActionInProgress,
			setSelection
		);
	}
	return buttons.current;
}

export default function BulkActionsToolbar( {
	data,
	selection,
	actions = EMPTY_ARRAY,
	setSelection,
	getItemId,
} ) {
	const isReducedMotion = useReducedMotion();
	const selectedItems = useMemo( () => {
		return data.filter( ( item ) =>
			selection.includes( getItemId( item ) )
		);
	}, [ selection, data, getItemId ] );

	const actionsToShow = useMemo(
		() =>
			actions.filter( ( action ) => {
				return (
					action.supportsBulk &&
					action.icon &&
					selectedItems.some( ( item ) => action.isEligible( item ) )
				);
			} ),
		[ actions, selectedItems ]
	);

	if (
		( selection && selection.length === 0 ) ||
		actionsToShow.length === 0
	) {
		return null;
	}

	return (
		<AnimatePresence>
			<motion.div
				layout={ ! isReducedMotion } // See https://www.framer.com/docs/animation/#layout-animations
				initial={ 'init' }
				animate={ 'open' }
				exit={ 'exit' }
				variants={ isReducedMotion ? undefined : SNACKBAR_VARIANTS }
				className="dataviews-bulk-actions"
			>
				<Toolbar label={ __( 'Bulk actions' ) }>
					<div className="dataviews-bulk-actions-toolbar-wrapper">
						<ToolbarContent
							selection={ selection }
							actionsToShow={ actionsToShow }
							selectedItems={ selectedItems }
							setSelection={ setSelection }
						/>
					</div>
				</Toolbar>
			</motion.div>
		</AnimatePresence>
	);
}
