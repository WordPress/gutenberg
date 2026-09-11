import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Modal } from '@wordpress/components';
import { InputControl, Stack } from '@wordpress/ui';
import { useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import type { MediaFolder } from './folder-select';

type NewFolderModalProps = {
	/**
	 * Creates the folder, resolving with its term record. Supplied by the host
	 * editor, since this package can't write a taxonomy itself.
	 */
	create: ( name: string ) => Promise< MediaFolder >;
	onCreated: ( folder: MediaFolder ) => void;
	onClose: () => void;
};

/**
 * Turns a rejected folder creation into something worth showing a user.
 *
 * A rejected `apiFetch` isn't necessarily an `Error`: a REST error arrives as a
 * plain `{ code, message }` object, and a custom fetch handler can reject with
 * anything at all. So the shape is read defensively, and the one failure a user
 * can actually act on — a folder by that name already existing — gets its own
 * wording rather than the server's generic "term already exists" phrasing.
 */
function getCreateErrorMessage( error: unknown ) {
	const rejection = error as { code?: string; message?: string } | undefined;
	if ( rejection?.code === 'term_exists' ) {
		return __( 'A folder with that name already exists.' );
	}
	return typeof rejection?.message === 'string' && rejection.message
		? rejection.message
		: __( 'Could not create the folder.' );
}

/**
 * Asks for a name and creates a media folder.
 */
export default function NewFolderModal( {
	create,
	onCreated,
	onClose,
}: NewFolderModalProps ) {
	const [ name, setName ] = useState( '' );
	const [ isSaving, setIsSaving ] = useState( false );
	const { createErrorNotice, createSuccessNotice } =
		useDispatch( noticesStore );
	const trimmedName = name.trim();

	const handleSubmit = useCallback(
		async ( event: React.FormEvent ) => {
			event.preventDefault();
			if ( ! trimmedName || isSaving ) {
				return;
			}
			setIsSaving( true );
			try {
				const folder = await create( trimmedName );
				createSuccessNotice( __( 'Folder created.' ), {
					type: 'snackbar',
					id: 'inserter-notice',
				} );
				onCreated( folder );
			} catch ( error ) {
				// The modal stays open on failure so the name isn't lost and can
				// be corrected — a duplicate name is the likely cause.
				createErrorNotice( getCreateErrorMessage( error ), {
					type: 'snackbar',
					id: 'inserter-notice',
				} );
			} finally {
				setIsSaving( false );
			}
		},
		[
			trimmedName,
			isSaving,
			create,
			onCreated,
			createSuccessNotice,
			createErrorNotice,
		]
	);

	return (
		<Modal
			title={ __( 'New folder' ) }
			onRequestClose={ onClose }
			size="small"
		>
			<form onSubmit={ handleSubmit }>
				<Stack direction="column" gap="md">
					<InputControl
						label={ __( 'Name' ) }
						description={ __(
							'Folders group media in the inserter. They are not shown on the site.'
						) }
						value={ name }
						onValueChange={ ( value: string ) => setName( value ) }
						autoComplete="off"
					/>
					<Stack direction="row" gap="sm" justify="flex-end">
						<Button
							__next40pxDefaultSize
							variant="tertiary"
							onClick={ onClose }
						>
							{ __( 'Cancel' ) }
						</Button>
						<Button
							__next40pxDefaultSize
							variant="primary"
							type="submit"
							isBusy={ isSaving }
							// Nothing to create without a name, but keep the button
							// reachable so the requirement is discoverable by
							// keyboard and screen reader.
							disabled={ ! trimmedName || isSaving }
							accessibleWhenDisabled
						>
							{ __( 'Create' ) }
						</Button>
					</Stack>
				</Stack>
			</form>
		</Modal>
	);
}
