/**
 * External dependencies
 */
import type { FocusEvent, MutableRefObject } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useRef } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
// @ts-expect-error - No type declarations available for @wordpress/block-editor
// prettier-ignore
import { store as blockEditorStore, privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { NoteCard } from './note-card';
import { NoteForm } from './note-form';
import { FloatingContainer } from './floating-container';
import type { FloatingPosition } from './floating-container';
import { focusNoteThread } from './utils';
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';

const { useBlockElement } = unlock( blockEditorPrivateApis );

export function AddNote( {
	onSubmit,
	sidebarRef,
	floating,
}: {
	onSubmit: ( note: { content: string; parent?: number } ) => Promise< any >;
	sidebarRef: MutableRefObject< HTMLElement | null >;
	floating?: FloatingPosition;
} ) {
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
	const { selectNote, setPendingNoteSegments } = unlock(
		useDispatch( editorStore )
	);
	const isSubmittingRef = useRef( false );

	const unselectNote = () => {
		selectNote( undefined );
		// Drop any captured multi-block segments for the abandoned note.
		setPendingNoteSegments( null );
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
			onBlur={ ( event: FocusEvent< HTMLElement > ) => {
				// Don't deselect notes when the browser window/tab loses focus.
				if ( ! document.hasFocus() ) {
					return;
				}
				// Only cancel when focus moves to another real element. Focus can
				// briefly land on nothing (the document body) while the editor
				// settles - most visibly when opening the form collapses a
				// multi-block selection onto its anchor - and cancelling then
				// would discard the note before the user ever interacts with it.
				if ( ! event.relatedTarget ) {
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
				// Drop any captured multi-block segments for the abandoned note.
				setPendingNoteSegments( null );
			} }
		>
			<NoteCard>
				<NoteForm
					onSubmit={ async ( inputComment: string ) => {
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
