/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
// eslint-disable-next-line @wordpress/use-recommended-components
import { AlertDialog, Button, Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import styles from './actions.module.css';
import { useDashboardInternalContext } from '../../context/dashboard-context';
import { useDashboardUIContext } from '../../context/ui-context';
import { LayoutSettings } from '../layout-settings';
import { MoreActionsDropdown } from '../more-actions-dropdown';
import type { MoreActionsDropdownItem } from '../more-actions-dropdown';

/**
 * Header chrome for the dashboard. Two independent flows are exposed:
 *
 * - **Customize** (layout edits): toggles edit mode, surfaces the Add
 *   widgets / Cancel / Done toolbar. Commits the layout staging buffer
 *   on Done.
 * - **Layout settings** (more-actions dropdown entry): opens a side
 *   drawer with model, column behavior, and row height. Commits the
 *   settings staging buffer on Save inside the drawer.
 *
 * The two flows are mutually exclusive: the Layout settings entry is
 * disabled while edit mode is on so the settings drawer cannot
 * accumulate changes on top of pending layout edits, and vice versa.
 *
 * Returns `null` when the dashboard is mounted without `onEditChange`
 * so surfaces that don't expose edit mode can keep `Actions` in their
 * tree unconditionally.
 *
 * @return {React.ReactNode} - The Actions component.
 */
export function Actions(): React.ReactNode {
	const {
		editMode,
		onEditChange,
		onLayoutReset,
		commit,
		cancel: cancelStaging,
		hasUncommittedChanges,
		canEditGridSettings,
	} = useDashboardInternalContext();

	const [ isEditActionsMounted, setIsEditActionsMounted ] =
		useState( editMode );
	const [ isExitingEditActions, setIsExitingEditActions ] = useState( false );

	useEffect( () => {
		if ( editMode ) {
			setIsEditActionsMounted( true );
			setIsExitingEditActions( false );
			return;
		}

		if ( ! isEditActionsMounted ) {
			return;
		}

		setIsExitingEditActions( true );
		const exitTimeout = setTimeout( () => {
			setIsEditActionsMounted( false );
			setIsExitingEditActions( false );
		}, 220 );

		return () => clearTimeout( exitTimeout );
	}, [ editMode, isEditActionsMounted ] );

	const { setInserterOpen } = useDashboardUIContext();

	const [ isResetDialogOpen, setIsResetDialogOpen ] = useState( false );
	const [ isLayoutSettingsOpen, setIsLayoutSettingsOpen ] = useState( false );

	const handleEditMode = useCallback( () => {
		onEditChange?.( ! editMode );
	}, [ editMode, onEditChange ] );

	const insert = useCallback( () => {
		setInserterOpen( true );
	}, [ setInserterOpen ] );

	const cancel = useCallback( () => {
		cancelStaging();
	}, [ cancelStaging ] );

	const done = useCallback( () => {
		commit();
	}, [ commit ] );

	const openLayoutSettings = useCallback( () => {
		setIsLayoutSettingsOpen( true );
	}, [] );

	const moreActionsItems: MoreActionsDropdownItem[] = [
		{
			label: __( 'Reset to default' ),
			onClick: () => setIsResetDialogOpen( true ),
			disabled: ! onLayoutReset,
		},
	];

	if ( canEditGridSettings ) {
		moreActionsItems.unshift( {
			label: __( 'Layout settings' ),
			onClick: openLayoutSettings,
			disabled: editMode,
		} );
	}

	if ( ! onEditChange ) {
		return null;
	}

	return (
		<Stack direction="row" gap="sm">
			{ isEditActionsMounted ? (
				<Stack
					direction="row"
					gap="sm"
					className={
						isExitingEditActions
							? styles.editActionsExit
							: styles.editActionsEnter
					}
				>
					<Button
						variant="minimal"
						tone="brand"
						size="compact"
						onClick={ insert }
					>
						{ __( 'Add widgets' ) }
					</Button>

					<Button
						variant="minimal"
						tone="brand"
						size="compact"
						onClick={ cancel }
					>
						{ __( 'Cancel' ) }
					</Button>

					<Button
						variant="solid"
						tone="brand"
						size="compact"
						onClick={ done }
						disabled={ ! hasUncommittedChanges }
					>
						{ __( 'Done' ) }
					</Button>
				</Stack>
			) : (
				<Button
					variant="outline"
					tone="brand"
					size="compact"
					onClick={ handleEditMode }
				>
					{ __( 'Customize' ) }
				</Button>
			) }

			<MoreActionsDropdown items={ moreActionsItems } />

			<AlertDialog.Root
				open={ isResetDialogOpen }
				onOpenChange={ setIsResetDialogOpen }
				onConfirm={ async () => {
					await onLayoutReset?.();
					onEditChange?.( false );
					setIsResetDialogOpen( false );
				} }
			>
				<AlertDialog.Popup
					intent="irreversible"
					title={ __( 'Reset dashboard to default?' ) }
					description={ __(
						'All customizations will be permanently lost.'
					) }
					confirmButtonText={ __( 'Reset' ) }
				/>
			</AlertDialog.Root>

			{ canEditGridSettings && (
				<LayoutSettings
					open={ isLayoutSettingsOpen }
					onOpenChange={ setIsLayoutSettingsOpen }
				/>
			) }
		</Stack>
	);
}
