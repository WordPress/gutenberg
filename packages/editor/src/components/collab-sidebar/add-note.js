/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useRef } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	store as blockEditorStore,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { NoteCard } from './note-card';
import { NoteForm } from './note-form';
import { FloatingContainer } from './floating-container';
import { focusNoteThread } from './utils';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

const { useBlockElement } = unlock( blockEditorPrivateApis );

export function AddNote( { onSubmit, sidebarRef, floating } ) {
	const { clientId } = useSelect( ( select ) => {
		const { getSelectedBlockClientId } = select( blockEditorStore );
		return {
			clientId: getSelectedBlockClientId(),
		};
	}, [] );
	const selectedNote = useSelect(
		( select ) => unlock( select( editorStore ) ).getSelectedNote(),
		[]
	);
	const blockElement = useBlockElement( clientId );
	const { toggleBlockSpotlight } = unlock( useDispatch( blockEditorStore ) );
	const { selectNote } = unlock( useDispatch( editorStore ) );
	const isSubmittingRef = useRef( false );

	const unselectNote = () => {
		selectNote( undefined );
		blockElement?.focus();
		toggleBlockSpotlight( clientId, false );
	};

	if ( selectedNote !== 'new' || ! clientId ) {
		return null;
	}

	return (
		<FloatingContainer
			floating={ floating }
			className="editor-collab-sidebar-panel__thread is-selected"
			gap="md"
			tabIndex={ 0 }
			aria-label={ __( 'New note' ) }
			role="treeitem"
			style={
				floating ? { opacity: ! floating.y ? 0 : undefined } : undefined
			}
			onBlur={ ( event ) => {
				// Don't deselect notes when the browser window/tab loses focus.
				if ( ! document.hasFocus() ) {
					return;
				}
				// Prevent blur from closing the form while the async submit
				// is in progress. Clicking "Add note" moves focus away,
				// triggering blur before onSubmit completes.
				if ( isSubmittingRef.current ) {
					return;
				}
				if ( event.currentTarget.contains( event.relatedTarget ) ) {
					return;
				}
				toggleBlockSpotlight( clientId, false );
				selectNote( undefined );
			} }
		>
			<NoteCard>
				<NoteForm
					onSubmit={ async ( inputComment ) => {
						isSubmittingRef.current = true;
						const { id } = await onSubmit( {
							content: inputComment,
						} );
						selectNote( id );
						focusNoteThread( id, sidebarRef.current );
					} }
					onCancel={ unselectNote }
					labels={ { input: __( 'New note' ) } }
				/>
			</NoteCard>
		</FloatingContainer>
	);
}
