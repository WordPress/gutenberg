import { Button, Modal, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback, useState } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { Stack } from '@wordpress/ui';
import { store as blockEditorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';

/**
 * Turns a rejected folder creation into something worth showing a user.
 *
 * A rejected `apiFetch` isn't necessarily an `Error`: a REST error arrives as a
 * plain `{ code, message }` object, and a custom fetch handler can reject with
 * anything at all. So the shape is read defensively, and the one failure a user
 * can actually act on — a folder by that name already existing — gets its own
 * wording rather than the server's generic "term already exists" phrasing.
 *
 * @param {any} error The rejection value.
 * @return {string} A message to show.
 */
function getCreateErrorMessage( error ) {
	if ( error?.code === 'term_exists' ) {
		return __( 'A folder with that name already exists.' );
	}
	return typeof error?.message === 'string' && error.message
		? error.message
		: __( 'Could not create the folder.' );
}

/**
 * "Add folder" affordance for the inserter's Media tab: a button that opens a
 * modal asking for a name, and creates a media folder.
 *
 * Rendered only when the host editor supplies the `inserterMediaFolders`
 * capability (i.e. the media folders experiment is on) and the current user may
 * create folders. Creating one is a write against a WordPress taxonomy, which
 * this package can't do itself — hence the injected `create`.
 *
 * @param {Object}   props
 * @param {Function} props.onCreate Called with the new folder's term record.
 */
export default function AddFolderButton( { onCreate } ) {
	const mediaFolders = useSelect(
		( select ) =>
			unlock( select( blockEditorStore ) ).getInserterMediaFolders(),
		[]
	);
	const [ isOpen, setIsOpen ] = useState( false );
	const [ name, setName ] = useState( '' );
	const [ isSaving, setIsSaving ] = useState( false );
	const { createErrorNotice, createSuccessNotice } =
		useDispatch( noticesStore );

	const close = useCallback( () => {
		setIsOpen( false );
		setName( '' );
	}, [] );

	const trimmedName = name.trim();

	const handleSubmit = useCallback(
		async ( event ) => {
			event.preventDefault();
			if ( ! trimmedName || isSaving ) {
				return;
			}
			setIsSaving( true );
			try {
				const folder = await mediaFolders.create( trimmedName );
				close();
				createSuccessNotice( __( 'Folder created.' ), {
					type: 'snackbar',
					id: 'inserter-notice',
				} );
				onCreate?.( folder );
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
			mediaFolders,
			close,
			onCreate,
			createSuccessNotice,
			createErrorNotice,
		]
	);

	if ( ! mediaFolders?.canCreate ) {
		return null;
	}

	return (
		<>
			<Button
				__next40pxDefaultSize
				className="block-editor-inserter__media-add-folder-button"
				variant="secondary"
				onClick={ () => setIsOpen( true ) }
			>
				{ __( 'Add folder' ) }
			</Button>
			{ isOpen && (
				<Modal
					title={ __( 'Add folder' ) }
					onRequestClose={ close }
					size="small"
				>
					<form onSubmit={ handleSubmit }>
						<Stack direction="column" gap="md">
							<TextControl
								label={ __( 'Name' ) }
								help={ __(
									'Folders group media in the inserter. They are not shown on the site.'
								) }
								value={ name }
								onChange={ setName }
								autoComplete="off"
							/>
							<Stack
								direction="row"
								gap="sm"
								justify="flex-end"
								className="block-editor-inserter__media-add-folder-actions"
							>
								<Button
									__next40pxDefaultSize
									variant="tertiary"
									onClick={ close }
								>
									{ __( 'Cancel' ) }
								</Button>
								<Button
									__next40pxDefaultSize
									variant="primary"
									type="submit"
									isBusy={ isSaving }
									// Nothing to create without a name, but keep
									// the button reachable so the requirement is
									// discoverable by keyboard and screen reader.
									disabled={ ! trimmedName || isSaving }
									accessibleWhenDisabled
								>
									{ __( 'Create' ) }
								</Button>
							</Stack>
						</Stack>
					</form>
				</Modal>
			) }
		</>
	);
}
