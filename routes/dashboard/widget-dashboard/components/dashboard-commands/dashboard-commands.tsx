/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	useCommand,
	privateApis as commandsPrivateApis,
} from '@wordpress/commands';
import { layout } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { unlock } from '../../../lock-unlock';
import { useDashboardInternalContext } from '../../context/dashboard-context';

const { useCommandContext } = unlock( commandsPrivateApis );

export const DASHBOARD_COMMAND_CONTEXT = 'dashboard';

/**
 * Registers dashboard-specific command palette commands and sets the
 * active command context so they surface under Suggestions by default.
 */
export function DashboardCommands() {
	const { editMode, onEditChange } = useDashboardInternalContext();

	useCommandContext( DASHBOARD_COMMAND_CONTEXT );

	const customize = useCallback(
		( { close }: { close: () => void } ) => {
			onEditChange?.( true );
			close();
		},
		[ onEditChange ]
	);

	useCommand( {
		name: 'core/dashboard/customize',
		label: __( 'Customize dashboard' ),
		icon: layout,
		category: 'command',
		context: DASHBOARD_COMMAND_CONTEXT,
		keywords: [],
		disabled: ! onEditChange || editMode,
		callback: customize,
	} );

	return null;
}
