import { useEffect, useRef } from '@wordpress/element';
import { AlertDialog } from '@wordpress/ui';
import { useNavigationBlocker } from './router';
import { useOverlayContainer } from './shared';

/**
 * Asks before unsaved edits are thrown away. Keep editing is the safe
 * default; discarding can't be undone, so it uses the irreversible intent.
 */
export function DiscardChangesDialog( {
	open,
	onKeepEditing,
	onDiscard,
}: {
	open: boolean;
	onKeepEditing: () => void;
	onDiscard: () => void;
} ) {
	const overlayContainer = useOverlayContainer();
	// Confirming also closes the dialog, which must not count as keeping.
	const isDiscardingRef = useRef( false );
	useEffect( () => {
		if ( open ) {
			isDiscardingRef.current = false;
		}
	}, [ open ] );

	return (
		<AlertDialog.Root
			open={ open }
			onOpenChange={ ( nextOpen ) => {
				if ( ! nextOpen && ! isDiscardingRef.current ) {
					onKeepEditing();
				}
			} }
			onConfirm={ () => {
				isDiscardingRef.current = true;
				onDiscard();
			} }
		>
			<AlertDialog.Popup
				portal={ <AlertDialog.Portal container={ overlayContainer } /> }
				intent="irreversible"
				title="Discard unsaved changes?"
				description="If you leave, your changes will be lost."
				confirmButtonText="Discard changes"
				cancelButtonText="Keep editing"
			/>
		</AlertDialog.Root>
	);
}

/**
 * Guards a manual-save page: navigating away with unsaved edits asks first.
 */
export function UnsavedChangesGuard( { isDirty }: { isDirty: boolean } ) {
	const blocker = useNavigationBlocker( isDirty );
	return (
		<DiscardChangesDialog
			open={ blocker.status === 'blocked' }
			onKeepEditing={ () => blocker.reset?.() }
			onDiscard={ () => blocker.proceed?.() }
		/>
	);
}
