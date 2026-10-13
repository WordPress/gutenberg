import { __ } from '@wordpress/i18n';
// eslint-disable-next-line @wordpress/use-recommended-components
import { AlertDialog } from '@wordpress/ui';
import { useDashboardInternalContext } from '../../context/dashboard-context';
import { useDashboardUIContext } from '../../context/ui-context';

/**
 * Confirmation prompt for resetting the dashboard to its default layout,
 * mounted by the engine and shown while `resetDialogOpen` is set in the
 * shared UI context. Confirming runs `onLayoutReset` and leaves customize
 * mode. Renders nothing while the policy denies `reset`, so no trigger can
 * reach the handler around the hidden entry points.
 */
export function ResetConfirmation(): React.ReactNode {
	const { onLayoutReset, onEditChange, canPerform } =
		useDashboardInternalContext();
	const { resetDialogOpen, setResetDialogOpen } = useDashboardUIContext();

	if ( ! canPerform( { operation: 'reset' } ) ) {
		return null;
	}

	return (
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
	);
}
