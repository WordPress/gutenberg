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
import type { Action, AnyItem } from './types';
import type { ActionTriggerProps } from './item-actions';

interface ActionButtonProps< Item extends AnyItem > {
	action: Action< Item >;
	selectedItems: Item[];
	actionInProgress: string | null;
	setActionInProgress: ( actionId: string | null ) => void;
}

interface ToolbarContentProps< Item extends AnyItem > {
	selection: string[];
	actionsToShow: Action< Item >[];
	selectedItems: Item[];
	onSelectionChange: ( selection: Item[] ) => void;
}

interface BulkActionsToolbarProps< Item extends AnyItem > {
	data: Item[];
	selection: string[];
	actions: Action< Item >[];
	onSelectionChange: ( selection: Item[] ) => void;
	getItemId: ( item: Item ) => string;
}

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

function ActionTrigger< Item extends AnyItem >( {
	action,
	onClick,
	isBusy,
	items,
}: ActionTriggerProps< Item > ) {
	const label =
		typeof action.label === 'string' ? action.label : action.label( items );
	return (
		<ToolbarButton
			disabled={ isBusy }
			label={ label }
			icon={ action.icon }
			isDestructive={ action.isDestructive }
			size="compact"
			onClick={ onClick }
			isBusy={ isBusy }
			__experimentalIsFocusable
			tooltipPosition="top"
		/>
	);
}

const EMPTY_ARRAY: [] = [];

function ActionButton< Item extends AnyItem >( {
	action,
	selectedItems,
	actionInProgress,
	setActionInProgress,
}: ActionButtonProps< Item > ) {
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
				ActionTrigger={ ActionTrigger }
			/>
		);
	}
	return (
		<ActionTrigger
			key={ action.id }
			action={ action }
			onClick={ () => {
				setActionInProgress( action.id );
				action.callback( selectedItems );
			} }
			items={ selectedEligibleItems }
			isBusy={ actionInProgress === action.id }
		/>
	);
}

function renderToolbarContent< Item extends AnyItem >(
	selection: string[],
	actionsToShow: Action< Item >[],
	selectedItems: Item[],
	actionInProgress: string | null,
	setActionInProgress: ( actionId: string | null ) => void,
	onSelectionChange: ( selection: Item[] ) => void
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
					tooltipPosition="top"
					label={ __( 'Cancel' ) }
					disabled={ !! actionInProgress }
					onClick={ () => {
						onSelectionChange( EMPTY_ARRAY );
					} }
				/>
			</ToolbarGroup>
		</>
	);
}

function ToolbarContent< Item extends AnyItem >( {
	selection,
	actionsToShow,
	selectedItems,
	onSelectionChange,
}: ToolbarContentProps< Item > ) {
	const [ actionInProgress, setActionInProgress ] = useState< string | null >(
		null
	);
	const buttons = useRef< JSX.Element | null >( null );
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
			onSelectionChange
		);
	} else if ( ! buttons.current ) {
		buttons.current = renderToolbarContent(
			selection,
			actionsToShow,
			selectedItems,
			actionInProgress,
			setActionInProgress,
			onSelectionChange
		);
	}
	return buttons.current;
}

export default function BulkActionsToolbar< Item extends AnyItem >( {
	data,
	selection,
	actions = EMPTY_ARRAY,
	onSelectionChange,
	getItemId,
}: BulkActionsToolbarProps< Item > ) {
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
					selectedItems.some(
						( item ) =>
							! action.isEligible || action.isEligible( item )
					)
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
				initial="init"
				animate="open"
				exit="exit"
				variants={ isReducedMotion ? undefined : SNACKBAR_VARIANTS }
				className="dataviews-bulk-actions"
			>
				<Toolbar label={ __( 'Bulk actions' ) }>
					<div className="dataviews-bulk-actions-toolbar-wrapper">
						<ToolbarContent
							selection={ selection }
							actionsToShow={ actionsToShow }
							selectedItems={ selectedItems }
							onSelectionChange={ onSelectionChange }
						/>
					</div>
				</Toolbar>
			</motion.div>
		</AnimatePresence>
	);
}
