/**
 * WordPress dependencies
 */
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
// eslint-disable-next-line @wordpress/use-recommended-components
import { AlertDialog, Button, Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { useDashboardInternalContext } from '../../context/dashboard-context';
import { useDashboardUIContext } from '../../context/ui-context';
import { MoreActionsDropdown } from '../more-actions-dropdown';
import type { MoreActionsDropdownItem } from '../more-actions-dropdown';

/**
 * Renders the dashboard's edit-mode toggle. Shows a "Customize" button while
 * `editMode` is off and the edit-mode toolbar (Add widgets, Cancel, Done,
 * plus a more-actions dropdown) while it is on. Clicking either fires
 * `onEditChange` with the toggled value.
 *
 * Returns `null` when the dashboard is mounted without `onEditChange` so
 * surfaces that don't expose edit mode can keep `Actions` in their tree
 * unconditionally.
 *
 * @return {React.ReactNode} - The Actions component.
 */
export function Actions(): React.ReactNode {
	const { editMode, onEditChange, onLayoutReset } =
		useDashboardInternalContext();

	const { setInserterOpen } = useDashboardUIContext();

	const [ isResetDialogOpen, setIsResetDialogOpen ] = useState( false );

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

	const moreActionsItems: MoreActionsDropdownItem[] = [
		{
			label: __( 'Reset to default' ),
			onClick: () => setIsResetDialogOpen( true ),
			disabled: ! onLayoutReset,
		},
	];

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
		</Stack>
	);
}
