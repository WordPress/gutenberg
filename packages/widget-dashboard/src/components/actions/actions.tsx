/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { layout as layoutIcon, plus } from '@wordpress/icons';
import { store as viewportStore } from '@wordpress/viewport';
// eslint-disable-next-line @wordpress/use-recommended-components
import { Button, Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { useDashboardInternalContext } from '../../context/dashboard-context';
import { useDashboardUIContext } from '../../context/ui-context';
import { ActionsMenu } from '../actions-menu';
import type { ActionsMenuItem } from '../actions-menu';
import styles from './actions.module.css';

/**
 * Edit toolbar for the dashboard. In customize mode it surfaces Add widget,
 * Layout settings (when grid settings are editable), Cancel, and Done;
 * otherwise a single Customize button. Buttons and the overflow menu are
 * triggers that flip the shared UI state the overlays react to.
 *
 * Returns `null` when mounted without `onEditChange`, so hosts that don't
 * expose edit mode can keep `Actions` in their tree unconditionally.
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

	const { setInserterOpen, setLayoutSettingsOpen, setResetDialogOpen } =
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

	const openLayoutSettings = useCallback( () => {
		setLayoutSettingsOpen( true );
	}, [ setLayoutSettingsOpen ] );

	const menuItems: ActionsMenuItem[] = [
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

					{ canEditGridSettings && (
						<Button
							variant="minimal"
							tone="brand"
							size="compact"
							onClick={ openLayoutSettings }
						>
							{ ! isMobileViewport && (
								<Button.Icon icon={ layoutIcon } />
							) }
							{ __( 'Layout settings' ) }
						</Button>
					) }

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

			<ActionsMenu items={ menuItems } />
		</Stack>
	);
}
