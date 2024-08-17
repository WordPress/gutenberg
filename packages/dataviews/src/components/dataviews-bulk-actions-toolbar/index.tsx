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
import { useMemo, useState, useRef, useContext } from '@wordpress/element';
import { _n, sprintf, __ } from '@wordpress/i18n';
import { closeSmall } from '@wordpress/icons';
import { useReducedMotion } from '@wordpress/compose';
import { useRegistry } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { useSomeItemHasAPossibleBulkAction } from '../dataviews-bulk-actions';
import DataViewsContext from '../dataviews-context';
import { ActionWithModal } from '../dataviews-item-actions';
import { LAYOUT_GRID, LAYOUT_TABLE } from '../../constants';
import type { Action } from '../../types';
import type { ActionTriggerProps } from '../dataviews-item-actions';
import type { SetSelection } from '../../private-types';

interface ActionButtonProps< Item > {
	action: Action< Item >;
	selectedItems: Item[];
	actionInProgress: string | null;
	setActionInProgress: ( actionId: string | null ) => void;
}

interface ToolbarContentProps< Item > {
	selection: string[];
	actionsToShow: Action< Item >[];
	selectedItems: Item[];
	onChangeSelection: SetSelection;
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

function ActionTrigger< Item >( {
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
			tooltipPosition="top"
		/>
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
				action.callback( selectedItems, {
					registry,
				} );
			} }
			items={ selectedEligibleItems }
			isBusy={ actionInProgress === action.id }
		/>
	);
}

function renderToolbarContent< Item >(
	selection: string[],
	actionsToShow: Action< Item >[],
	selectedItems: Item[],
	actionInProgress: string | null,
	setActionInProgress: ( actionId: string | null ) => void,
	onChangeSelection: SetSelection
) {
	return (
		<>
			<ToolbarGroup>
				<div className="dataviews-bulk-actions-toolbar__selection-count">
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
						onChangeSelection( EMPTY_ARRAY );
					} }
				/>
			</ToolbarGroup>
		</>
	);
}

function ToolbarContent< Item >( {
	selection,
	actionsToShow,
	selectedItems,
	onChangeSelection,
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
			onChangeSelection
		);
	} else if ( ! buttons.current ) {
		buttons.current = renderToolbarContent(
			selection,
			actionsToShow,
			selectedItems,
			actionInProgress,
			setActionInProgress,
			onChangeSelection
		);
	}
	return buttons.current;
}

function _BulkActionsToolbar() {
	const {
		data,
		selection,
		actions = EMPTY_ARRAY,
		onChangeSelection,
		getItemId,
	} = useContext( DataViewsContext );
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
				className="dataviews-bulk-actions-toolbar"
			>
				<Toolbar label={ __( 'Bulk actions' ) }>
					<div className="dataviews-bulk-actions-toolbar__wrapper">
						<ToolbarContent
							selection={ selection }
							actionsToShow={ actionsToShow }
							selectedItems={ selectedItems }
							onChangeSelection={ onChangeSelection }
						/>
					</div>
				</Toolbar>
			</motion.div>
		</AnimatePresence>
	);
}

export default function BulkActionsToolbar() {
	const { data, actions = [], view } = useContext( DataViewsContext );
	const hasPossibleBulkAction = useSomeItemHasAPossibleBulkAction(
		actions,
		data
	);
	if (
		! [ LAYOUT_TABLE, LAYOUT_GRID ].includes( view.type ) ||
		! hasPossibleBulkAction
	) {
		return null;
	}

	return <_BulkActionsToolbar />;
}
