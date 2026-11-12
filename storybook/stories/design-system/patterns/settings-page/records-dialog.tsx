import { Page } from '@wordpress/admin-ui';
import type { Action } from '@wordpress/dataviews';
import { pencil } from '@wordpress/icons';
import { Button, Dialog } from '@wordpress/ui';
import type { ApiKey } from './api-keys';
import {
	emptyKey,
	KeyForm,
	KeysTable,
	useKeyEditor,
	useKeys,
} from './api-keys';
import {
	SaveButton,
	SettingsContent,
	SettingsExample,
	useOverlayContainer,
} from './shared';
import { DiscardChangesDialog } from './unsaved-changes';

/**
 * Edits one record in a dialog. People leave through Cancel, which discards
 * the draft, or Save changes, which applies it; there is no close button and
 * clicking outside does nothing, so the choice is always explicit.
 */
export function KeyDialog( {
	editor,
}: {
	editor: ReturnType< typeof useKeyEditor >;
} ) {
	const overlayContainer = useOverlayContainer();
	// The alert dialog sits outside `Dialog.Root`: Base UI doesn't render a
	// backdrop for a dialog nested inside another, which would leave this
	// dialog undimmed behind it.
	return (
		<>
			<Dialog.Root
				open={ editor.isOpen }
				onOpenChange={ editor.onOpenChange }
				disablePointerDismissal
			>
				<Dialog.Popup
					portal={ <Dialog.Portal container={ overlayContainer } /> }
				>
					<Dialog.Header>
						<Dialog.Title>
							{ editor.isNew ? 'Add API key' : 'Edit API key' }
						</Dialog.Title>
					</Dialog.Header>
					<Dialog.Content>
						<form id={ editor.formId } onSubmit={ editor.onSubmit }>
							<KeyForm
								data={ editor.draft }
								onChange={ editor.onChange }
							/>
						</form>
					</Dialog.Content>
					<Dialog.Footer>
						<Dialog.Action
							variant="minimal"
							tone="neutral"
							disabled={ editor.isSaving }
						>
							Cancel
						</Dialog.Action>
						<KeySaveButton editor={ editor } />
					</Dialog.Footer>
				</Dialog.Popup>
			</Dialog.Root>
			<DiscardChangesDialog
				open={ editor.discard.isConfirming }
				onKeepEditing={ editor.discard.keepEditing }
				onDiscard={ editor.discard.confirm }
			/>
		</>
	);
}

/**
 * Submits a record editor. A new record has nothing to compare against, so
 * its button stays enabled, and submitting an empty form explains what's
 * missing.
 */
export function KeySaveButton( {
	editor,
}: {
	editor: ReturnType< typeof useKeyEditor >;
} ) {
	return (
		<SaveButton
			form={ editor.formId }
			hasChanges={ editor.isNew || editor.isDirty }
			isSaving={ editor.isSaving }
		>
			{ editor.isNew ? 'Add API key' : 'Save changes' }
		</SaveButton>
	);
}

export function AddKeyButton( { onClick }: { onClick: () => void } ) {
	return (
		<Button size="compact" variant="solid" onClick={ onClick }>
			Add API key
		</Button>
	);
}

function RecordsDialogPage() {
	const { keys, saveKey } = useKeys();
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
			<KeyDialog editor={ editor } />
		</Page>
	);
}

/**
 * A table of records where each record opens a dialog. Use it for short
 * editors, when people should stay in the context of the table.
 */
export function RecordsDialogExample() {
	return (
		<SettingsExample>
			<RecordsDialogPage />
		</SettingsExample>
	);
}
