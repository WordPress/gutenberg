/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
// eslint-disable-next-line @wordpress/use-recommended-components
import { Button, Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import styles from './actions.module.css';
import { useDashboardInternalContext } from '../../context/dashboard-context';

/**
 * Renders the dashboard's edit-mode toggle. Shows a "Customize" button while
 * `editMode` is off and a "Done" button while it is on; clicking either fires
 * `onEditChange` with the toggled value.
 *
 * Returns `null` when the dashboard is mounted without `onEditChange` so
 * surfaces that don't expose edit mode can keep `Actions` in their tree
 * unconditionally.
 *
 * @return {React.ReactNode} - The Actions component.
 */
export function Actions(): React.ReactNode {
	const { editMode, onEditChange } = useDashboardInternalContext();
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

	const handleEditMode = useCallback( () => {
		onEditChange?.( ! editMode );
	}, [ editMode, onEditChange ] );

	const handleInsertWidget = useCallback( () => {
		// eslint-disable-next-line no-console
		console.log( 'insert widget' ); // TODO: Implement widget insertion
	}, [] );

	const handleCancel = useCallback( () => {
		// eslint-disable-next-line no-console
		console.log( 'cancel' ); // TODO: Implement cancel\
		onEditChange?.( false );
	}, [ onEditChange ] );

	const handleDone = useCallback( () => {
		// eslint-disable-next-line no-console
		console.log( 'done' ); // TODO: Implement done
		onEditChange?.( false );
	}, [ onEditChange ] );

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
						onClick={ handleInsertWidget }
					>
						{ __( 'Add widgets' ) }
					</Button>
					<Button
						variant="minimal"
						tone="brand"
						size="compact"
						onClick={ handleCancel }
					>
						{ __( 'Cancel' ) }
					</Button>
					<Button
						variant="solid"
						tone="brand"
						size="compact"
						onClick={ handleDone }
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
		</Stack>
	);
}
