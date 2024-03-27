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
import { useMemo } from '@wordpress/element';
import { _n, sprintf, __ } from '@wordpress/i18n';
import { close } from '@wordpress/icons';
import { useReducedMotion } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { ActionWithModal } from './item-actions';

const SNACKBAR_VARIANTS = {
	init: {
		bottom: 0,
		opacity: 0,
	},
	open: {
		bottom: 24,
		opacity: 1,
		transition: {
			bottom: { type: 'tween', duration: 0.8, ease: [ 0, 0, 0.2, 1 ] },
			opacity: {
				type: 'tween',
				duration: 0.7,
				delay: 0.05,
				ease: [ 0, 0, 0.2, 1 ],
			},
		},
	},
	exit: {
		opacity: 0,
		transition: {
			type: 'tween',
			duration: 0.1,
			ease: [ 0, 0, 0.2, 1 ],
		},
	},
};

function PrimaryActionTrigger( { action, onClick, items } ) {
	const isDisabled = useMemo( () => {
		return items.some( ( item ) => ! action.isEligible( item ) );
	}, [ action, items ] );
	return (
		<ToolbarButton
			disabled={ isDisabled }
			label={ action.label }
			icon={ action.icon }
			isDestructive={ action.isDestructive }
			size="compact"
			onClick={ onClick }
		/>
	);
}

const EMPTY_ARRAY = [];

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

	const primaryActionsToShow = useMemo(
		() =>
			actions.filter( ( action ) => {
				return (
					action.supportsBulk &&
					action.isPrimary &&
					selectedItems.some( ( item ) => action.isEligible( item ) )
				);
			} ),
		[ actions, selectedItems ]
	);

	if (
		( selection && selection.length === 0 ) ||
		primaryActionsToShow.length === 0
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
						<ToolbarGroup>
							<ToolbarButton onClick={ () => {} } disabled>
								{
									// translators: %s: Total number of selected items.
									sprintf(
										// translators: %s: Total number of selected items.
										_n(
											'%s item',
											'%s items',
											selection.length
										),
										selection.length
									)
								}
							</ToolbarButton>
							{ primaryActionsToShow.map( ( action ) => {
								if ( !! action.RenderModal ) {
									return (
										<ActionWithModal
											key={ action.id }
											action={ action }
											items={ selectedItems }
											ActionTrigger={
												PrimaryActionTrigger
											}
										/>
									);
								}
								return (
									<PrimaryActionTrigger
										key={ action.id }
										action={ action }
										items={ selectedItems }
										onClick={ () =>
											action.callback( selectedItems )
										}
									/>
								);
							} ) }
						</ToolbarGroup>
						<ToolbarGroup>
							<ToolbarButton
								icon={ close }
								onClick={ () => {
									setSelection( EMPTY_ARRAY );
								} }
							/>
						</ToolbarGroup>
					</div>
				</Toolbar>
			</motion.div>
		</AnimatePresence>
	);
}
