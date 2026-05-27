/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { plus } from '@wordpress/icons';
import { store as viewportStore } from '@wordpress/viewport';
// eslint-disable-next-line @wordpress/use-recommended-components
import { AlertDialog, Button, Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import styles from './actions.module.css';
import { useDashboardInternalContext } from '../../context/dashboard-context';
import { useDashboardUIContext } from '../../context/ui-context';
import { LayoutModeDropdown } from '../layout-mode-dropdown';
import { MoreActionsDropdown } from '../more-actions-dropdown';
import type { MoreActionsDropdownItem } from '../more-actions-dropdown';

/**
 * Header chrome for the dashboard. Two independent flows are exposed:
 *
 * - **Customize** (layout edits): toggles edit mode, surfaces the Add
 *   widgets / Layout / Cancel / Done toolbar. Commits the layout staging
 *   buffer on Done.
 * - **Layout** (dropdown next to Add widget): switches between Grid and
 *   Masonry immediately via `commitGridModelChange` while staying in edit
 *   mode.
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

	const { setInserterOpen, resetDialogOpen, setResetDialogOpen } =
		useDashboardUIContext();
	// @TODO: switch to using Admin UI declaratively for mobile viewport support once available.
	// https://github.com/WordPress/gutenberg/issues/77628
	const isMobileViewport = useSelect(
		( select ) => select( viewportStore ).isViewportMatch( '< small' ),
		[]
	);

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

	const moreActionsItems: MoreActionsDropdownItem[] = [
		{
			label: __( 'Reset to default' ),
			onClick: () => setResetDialogOpen( true ),
			disabled: ! onLayoutReset,
		},
	];

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
						{ ! isMobileViewport && <Button.Icon icon={ plus } /> }
						{ __( 'Add widget' ) }
					</Button>

					{ canEditGridSettings && <LayoutModeDropdown /> }

					<div
						className={ styles.editActionsDivider }
						aria-hidden="true"
					/>

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
					variant="minimal"
					tone="brand"
					size="compact"
					onClick={ handleEditMode }
				>
					{ __( 'Customize' ) }
				</Button>
			) }

			<MoreActionsDropdown items={ moreActionsItems } />

			<AlertDialog.Root
				open={ resetDialogOpen }
				onOpenChange={ setResetDialogOpen }
				onConfirm={ async () => {
					await onLayoutReset?.();
					onEditChange?.( false );
					setResetDialogOpen( false );
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
		</Stack>
	);
}
