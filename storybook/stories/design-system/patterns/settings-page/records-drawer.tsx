import { Page } from '@wordpress/admin-ui';
import type { Action } from '@wordpress/dataviews';
import { useRef, useState } from '@wordpress/element';
import { isRTL } from '@wordpress/i18n';
import { pencil } from '@wordpress/icons';
import { AlertDialog, Button, Drawer } from '@wordpress/ui';
import type { ApiKey } from './api-keys';
import {
	emptyKey,
	focusTargetAfterRemoval,
	KeyForm,
	KeysTable,
	useKeyEditor,
	useKeys,
} from './api-keys';
import { AddKeyButton, KeySaveButton } from './records-dialog';
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
	pageRef,
	addButtonRef,
}: {
	editor: ReturnType< typeof useKeyEditor >;
	onRevoke: ( key: ApiKey ) => void;
	pageRef: { current: HTMLElement | null };
	addButtonRef: { current: HTMLElement | null };
} ) {
	const [ isConfirmingRevoke, setIsConfirmingRevoke ] = useState( false );
	const revokeButtonRef = useRef< HTMLButtonElement >( null );
	// Set only for a revoke that succeeded, so canceling still returns to
	// Revoke while closing the drawer focuses whatever remains.
	const revokedFocusRef = useRef< HTMLElement | null >( null );
	const notify = useNotify();
	const overlayContainer = useOverlayContainer();

	const revokeKey = async () => {
		await simulateRequest();
		const target = focusTargetAfterRemoval(
			editor.record.id,
			pageRef.current,
			addButtonRef.current
		);
		// Read by the dialog and drawer as they close. Cleared afterwards so
		// a later close returns focus normally.
		revokedFocusRef.current = target;
		onRevoke( editor.record );
		editor.close();
		notify( 'API key revoked.' );
		// Both overlays restore focus while closing, and the record they
		// opened from is gone by then. Place focus once that has settled,
		// then drop the target so the next close behaves normally.
		window.setTimeout( () => target?.focus(), 50 );
		window.setTimeout( () => {
			revokedFocusRef.current = null;
		}, 300 );
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
					finalFocus={ () =>
						revokedFocusRef.current ?? editor.finalFocus()
					}
				>
					<Drawer.Header>
						<Drawer.Title>
							{ editor.isNew ? 'Add API key' : 'Edit API key' }
						</Drawer.Title>
					</Drawer.Header>
					<Drawer.Content>
						<form id={ editor.formId } onSubmit={ editor.onSubmit }>
							<KeyForm
								data={ editor.draft }
								onChange={ editor.onChange }
							/>
						</form>
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
						<KeySaveButton editor={ editor } />
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
					finalFocus={ () =>
						revokedFocusRef.current ?? revokeButtonRef.current
					}
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
	const pageRef = useRef< HTMLDivElement >( null );
	const addButtonRef = useRef< HTMLButtonElement >( null );
	const editor = useKeyEditor( saveKey, {
		scopeRef: pageRef,
		addButtonRef,
	} );
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
		<div ref={ pageRef } className={ styles.screen }>
			<Page
				title="API keys"
				subTitle="Let apps and services connect to your site."
				showSidebarToggle={ false }
				hasPadding
				actions={
					<AddKeyButton
						buttonRef={ addButtonRef }
						onClick={ () => editor.open( emptyKey ) }
					/>
				}
			>
				<SettingsContent wide>
					<KeysTable
						keys={ keys }
						actions={ actions }
						onClickItem={ editor.open }
					/>
				</SettingsContent>
				<KeyDrawer
					editor={ editor }
					onRevoke={ revokeKey }
					pageRef={ pageRef }
					addButtonRef={ addButtonRef }
				/>
			</Page>
		</div>
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
