import { Page } from '@wordpress/admin-ui';
import type { Action } from '@wordpress/dataviews';
import { useRef, useState } from '@wordpress/element';
import { isRTL } from '@wordpress/i18n';
import { pencil } from '@wordpress/icons';
import { AlertDialog, Button, Drawer } from '@wordpress/ui';
import type { ApiKey } from './api-keys';
import {
	emptyKey,
	KeyForm,
	KeysTable,
	useKeyEditor,
	useKeys,
} from './api-keys';
import { AddKeyButton } from './records-dialog';
import {
	SettingsContent,
	SettingsExample,
	simulateRequest,
	useNotify,
	useOverlayContainer,
} from './shared';
import styles from './style.module.css';
import { DiscardChangesDialog } from './unsaved-changes';

/**
 * Edits one record in a drawer, which keeps the table in view and leaves
 * room for secondary actions. Like the dialog, it closes only through its
 * footer actions. Revoking asks for confirmation first, because it cannot
 * be undone.
 */
function KeyDrawer( {
	editor,
	onRevoke,
}: {
	editor: ReturnType< typeof useKeyEditor >;
	onRevoke: ( key: ApiKey ) => void;
} ) {
	const [ isConfirmingRevoke, setIsConfirmingRevoke ] = useState( false );
	const revokeButtonRef = useRef< HTMLButtonElement >( null );
	const notify = useNotify();
	const overlayContainer = useOverlayContainer();

	const revokeKey = async () => {
		await simulateRequest();
		onRevoke( editor.record );
		editor.close();
		notify( 'API key revoked.' );
	};

	// The alert dialogs sit outside `Drawer.Root`: Base UI doesn't render a
	// backdrop for a dialog nested inside another, which would leave the
	// drawer undimmed behind them.
	return (
		<>
			<Drawer.Root
				swipeDirection={ isRTL() ? 'left' : 'right' }
				open={ editor.isOpen }
				onOpenChange={ editor.onOpenChange }
				disablePointerDismissal
			>
				<Drawer.Popup
					portal={ <Drawer.Portal container={ overlayContainer } /> }
				>
					<Drawer.Header>
						<Drawer.Title>
							{ editor.isNew ? 'Add API key' : 'Edit API key' }
						</Drawer.Title>
					</Drawer.Header>
					<Drawer.Content>
						<KeyForm
							data={ editor.draft }
							onChange={ editor.onChange }
						/>
					</Drawer.Content>
					<Drawer.Footer>
						{ ! editor.isNew && (
							<Button
								ref={ revokeButtonRef }
								variant="minimal"
								tone="neutral"
								className={ styles[ 'footer-start' ] }
								disabled={ editor.isSaving }
								onClick={ () => setIsConfirmingRevoke( true ) }
							>
								Revoke
							</Button>
						) }
						<Drawer.Action
							variant="minimal"
							tone="neutral"
							disabled={ editor.isSaving }
						>
							Cancel
						</Drawer.Action>
						<Button
							disabled={
								! editor.isDirty ||
								! editor.isValid ||
								editor.isSaving
							}
							loading={ editor.isSaving }
							loadingAnnouncement="Saving"
							onClick={ editor.save }
						>
							Save
						</Button>
					</Drawer.Footer>
				</Drawer.Popup>
			</Drawer.Root>
			<AlertDialog.Root
				open={ isConfirmingRevoke }
				onOpenChange={ setIsConfirmingRevoke }
				onConfirm={ revokeKey }
			>
				<AlertDialog.Popup
					portal={
						<AlertDialog.Portal container={ overlayContainer } />
					}
					finalFocus={ revokeButtonRef }
					intent="irreversible"
					title={ `Revoke “${ editor.record.name }”?` }
					description="Apps using this key will lose access immediately. This can’t be undone."
					confirmButtonText="Revoke key"
				/>
			</AlertDialog.Root>
			<DiscardChangesDialog
				open={ editor.discard.isConfirming }
				onKeepEditing={ editor.discard.keepEditing }
				onDiscard={ editor.discard.confirm }
			/>
		</>
	);
}

function RecordsDrawerPage() {
	const { keys, saveKey, revokeKey } = useKeys();
	const editor = useKeyEditor( saveKey );
	const actions: Action< ApiKey >[] = [
		{
			id: 'edit',
			label: 'Edit',
			icon: pencil,
			isPrimary: true,
			callback: ( [ key ] ) => editor.open( key ),
		},
	];

	return (
		<Page
			title="API keys"
			subTitle="Let apps and services connect to your site."
			showSidebarToggle={ false }
			hasPadding
			actions={
				<AddKeyButton onClick={ () => editor.open( emptyKey ) } />
			}
		>
			<SettingsContent wide>
				<KeysTable
					keys={ keys }
					actions={ actions }
					onClickItem={ editor.open }
				/>
			</SettingsContent>
			<KeyDrawer editor={ editor } onRevoke={ revokeKey } />
		</Page>
	);
}

/**
 * A table of records where each record opens a drawer, which holds the
 * editor and a destructive action that opens a confirmation dialog.
 */
export function RecordsDrawerExample() {
	return (
		<SettingsExample>
			<RecordsDrawerPage />
		</SettingsExample>
	);
}
