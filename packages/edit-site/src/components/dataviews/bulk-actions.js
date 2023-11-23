/**
 * WordPress dependencies
 */
import {
	ToolbarButton,
	Toolbar,
	ToolbarGroup,
	ToolbarItem,
	Popover,
} from '@wordpress/components';
import { useMemo } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';

function PrimaryActionTrigger( { action, onClick } ) {
	return (
		<ToolbarButton
			label={ action.label }
			icon={ action.icon }
			isDestructive={ action.isDestructive }
			size="compact"
			onClick={ onClick }
		/>
	);
}

const EMPTY_ARRAY = [];

export default function BulkActions( {
	data,
	selection,
	bulkActions = EMPTY_ARRAY,
	setSelection,
} ) {
	const primaryActions = useMemo(
		() =>
			bulkActions.filter( ( action ) => {
				return action.isPrimary && action.isEligible( data, selection );
			} ),
		[ bulkActions, data, selection ]
	);
	if (
		( selection && selection.length === 0 ) ||
		primaryActions.length === 0
	) {
		return null;
	}
	return (
		<Popover
			placement="top-middle"
			className="dataviews-bulk-actions-popover"
		>
			<Toolbar label="Bulk actions">
				<div className="dataviews-bulk-actions-toolbar-wrapper">
					<ToolbarGroup>
						<ToolbarButton onClick={ () => {} } disabled={ true }>
							{
								// translators: %s: Total number of selected items.
								sprintf(
									// translators: %s: Total number of selected items.
									_n(
										'%s item selected',
										'%s items selected',
										selection.length
									),
									selection.length
								)
							}
						</ToolbarButton>
						<ToolbarButton
							onClick={ () => {
								setSelection( EMPTY_ARRAY );
							} }
						>
							{ __( 'Deselect' ) }
						</ToolbarButton>
					</ToolbarGroup>
					<ToolbarGroup>
						{ primaryActions.map( ( action ) => {
							return (
								<PrimaryActionTrigger
									key={ action.id }
									action={ action }
									onClick={ () =>
										action.callback( data, selection )
									}
								/>
							);
						} ) }
					</ToolbarGroup>
				</div>
			</Toolbar>
		</Popover>
	);
}
