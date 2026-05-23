/**
 * WordPress dependencies
 */
import { useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	useCommands,
	privateApis as commandsPrivateApis,
} from '@wordpress/commands';
import {
	columns,
	grid,
	layout as layoutIcon,
	plus,
	trash,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { unlock } from '../../../lock-unlock';
import { useDashboardInternalContext } from '../../context/dashboard-context';
import { useDashboardUIContext } from '../../context/ui-context';
import { getGridModel } from '../../utils/grid-model-change';
import { usePendingWhenEditMode } from './use-pending-when-edit-mode';

const { useCommandContext } = unlock( commandsPrivateApis );

export const DASHBOARD_COMMAND_CONTEXT = 'dashboard';

type CommandCallback = ( options: { close: () => void } ) => void;

/**
 * Registers dashboard-specific command palette commands and sets the
 * active command context so they surface under Suggestions by default.
 */
export function DashboardCommands() {
	const {
		editMode,
		onEditChange,
		onLayoutReset,
		gridSettings,
		canEditGridSettings,
		commitGridModelChange,
	} = useDashboardInternalContext();

	const { setInserterOpen, setResetDialogOpen } = useDashboardUIContext();

	useCommandContext( DASHBOARD_COMMAND_CONTEXT );

	const runWhenInEditMode = usePendingWhenEditMode( {
		editMode,
		onEditChange,
	} );

	const gridModel = getGridModel( gridSettings );
	const isGridLayout = gridModel === 'grid';
	const isMasonryLayout = gridModel === 'masonry';

	const switchToMasonry = useCallback< CommandCallback >(
		( { close } ) => {
			close();
			commitGridModelChange( 'masonry' );
		},
		[ commitGridModelChange ]
	);

	const switchToGrid = useCallback< CommandCallback >(
		( { close } ) => {
			close();
			commitGridModelChange( 'grid' );
		},
		[ commitGridModelChange ]
	);

	const resetToDefault = useCallback< CommandCallback >(
		( { close } ) => {
			close();
			setResetDialogOpen( true );
		},
		[ setResetDialogOpen ]
	);

	const addWidgets = useCallback< CommandCallback >(
		( { close } ) => {
			close();
			runWhenInEditMode( () => {
				setInserterOpen( true );
			} );
		},
		[ runWhenInEditMode, setInserterOpen ]
	);

	const customize = useCallback< CommandCallback >(
		( { close } ) => {
			close();
			onEditChange?.( true );
		},
		[ onEditChange ]
	);

	const commands = useMemo(
		() => [
			{
				name: 'core/dashboard/customize',
				label: __( 'Customize dashboard' ),
				icon: layoutIcon,
				category: 'command',
				context: DASHBOARD_COMMAND_CONTEXT,
				keywords: [ __( 'edit' ), __( 'widgets' ), __( 'layout' ) ],
				disabled: ! onEditChange || editMode,
				callback: customize,
			},
			{
				name: 'core/dashboard/add-widgets',
				label: __( 'Add dashboard widgets' ),
				icon: plus,
				category: 'command',
				context: DASHBOARD_COMMAND_CONTEXT,
				keywords: [ __( 'widgets' ), __( 'inserter' ) ],
				disabled: ! onEditChange,
				callback: addWidgets,
			},
			{
				name: 'core/dashboard/switch-to-masonry-layout',
				label: __( 'Switch dashboard to masonry layout' ),
				icon: columns,
				category: 'command',
				context: DASHBOARD_COMMAND_CONTEXT,
				keywords: [
					__( 'layout' ),
					__( 'layout model' ),
					__( 'masonry' ),
				],
				disabled: ! canEditGridSettings || isMasonryLayout || editMode,
				callback: switchToMasonry,
			},
			{
				name: 'core/dashboard/switch-to-grid-layout',
				label: __( 'Switch dashboard to grid layout' ),
				icon: grid,
				category: 'command',
				context: DASHBOARD_COMMAND_CONTEXT,
				keywords: [
					__( 'layout' ),
					__( 'layout model' ),
					__( 'grid' ),
					__( 'standard grid' ),
				],
				disabled: ! canEditGridSettings || isGridLayout || editMode,
				callback: switchToGrid,
			},
			{
				name: 'core/dashboard/reset-to-default',
				label: __( 'Reset dashboard widgets to default' ),
				icon: trash,
				category: 'command',
				context: DASHBOARD_COMMAND_CONTEXT,
				keywords: [ __( 'reset' ), __( 'default' ) ],
				disabled: ! onLayoutReset,
				callback: resetToDefault,
			},
		],
		[
			onEditChange,
			editMode,
			customize,
			addWidgets,
			canEditGridSettings,
			isMasonryLayout,
			isGridLayout,
			switchToMasonry,
			switchToGrid,
			onLayoutReset,
			resetToDefault,
		]
	);

	useCommands( commands );

	return null;
}
