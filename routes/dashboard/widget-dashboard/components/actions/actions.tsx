/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
// eslint-disable-next-line @wordpress/use-recommended-components
import { Button, Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { useDashboardInternalContext } from '../../context/dashboard-context';
import { useDashboardUIContext } from '../../context/ui-context';

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
	const { setInserterOpen } = useDashboardUIContext();

	const handleEditMode = useCallback( () => {
		onEditChange?.( ! editMode );
	}, [ editMode, onEditChange ] );

	const insert = useCallback( () => {
		setInserterOpen( true );
	}, [ setInserterOpen ] );

	const cancel = useCallback( () => {
		// eslint-disable-next-line no-console
		console.log( 'cancel' ); // TODO: Implement cancel\
		onEditChange?.( false );
	}, [ onEditChange ] );

	const done = useCallback( () => {
		// eslint-disable-next-line no-console
		console.log( 'done' ); // TODO: Implement done
		onEditChange?.( false );
	}, [ onEditChange ] );

	if ( ! onEditChange ) {
		return null;
	}

	return (
		<Stack direction="row" gap="sm">
			{ editMode ? (
				<>
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
					>
						{ __( 'Done' ) }
					</Button>
				</>
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
