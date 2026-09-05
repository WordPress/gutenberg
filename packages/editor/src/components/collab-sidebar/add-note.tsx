import type { MutableRefObject } from 'react';
import { __ } from '@wordpress/i18n';
import { useRef } from '@wordpress/element';
import { __experimentalUseFocusOutside as useFocusOutside } from '@wordpress/compose';
import { useSelect, useDispatch } from '@wordpress/data';
// @ts-expect-error - No type declarations available for @wordpress/block-editor
// prettier-ignore
import { store as blockEditorStore, privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
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
	/*
	 * The form's anchor block. A note taken over several blocks keeps the whole
	 * run multi-selected so the spotlight leaves every spanned block lit, and
	 * `getSelectedBlockClientId` reports nothing while a multi-selection is
	 * live - fall back to the first block of the run, which is the anchor.
	 */
	const { clientId } = useSelect( ( select ) => {
		const { getSelectedBlockClientId, getSelectedBlockClientIds } =
			select( blockEditorStore );
		return {
			clientId:
				getSelectedBlockClientId() ??
				getSelectedBlockClientIds()?.[ 0 ] ??
				null,
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
	const { getSelectedNote } = unlock( useSelect( editorStore ) );
	const isSubmittingRef = useRef( false );

	/*
	 * Dismiss the form once focus leaves it. `useFocusOutside` keeps the form
	 * open while focus stays in UI it owns: format popovers (e.g. the Cmd+K
	 * link UI) portal out of the form's DOM, but their focus events still
	 * bubble here through the React tree. It also ignores window/tab blur.
	 */
	const focusOutside = useFocusOutside( ( event ) => {
		// Keep the form open when focus returns to it, e.g. on link popover Escape.
		if (
			event.relatedTarget?.closest(
				'.editor-collab-sidebar-panel__add-note'
			)
		) {
			return;
		}
		// Never dismiss mid-submit; clicking "Add note" blurs before it settles.
		if ( isSubmittingRef.current ) {
			return;
		}

		/*
		 * Selection may have moved on before this deferred callback runs; only
		 * clear it while this still owns the selection, or it would wipe out the
		 * newly selected note.
		 */
		if ( getSelectedNote() === 'new' ) {
			toggleBlockSpotlight( clientId, false );
			selectNote( undefined );
			// Drop any captured multi-block segments for the abandoned note.
			setPendingNoteSegments( null );
		}
	} );

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
			className="editor-collab-sidebar-panel__add-note is-selected"
			gap="md"
			tabIndex={ 0 }
			aria-label={ __( 'New note' ) }
			role="treeitem"
			style={
				floating ? { opacity: ! floating.y ? 0 : undefined } : undefined
			}
			{ ...focusOutside }
		>
			<NoteCard>
				<NoteForm
					onSubmit={ async ( inputComment: string ) => {
						isSubmittingRef.current = true;
						try {
							/*
							 * The create action resolves `undefined` when the
							 * save fails (it surfaces its own error notice);
							 * keep the form open so the draft isn't lost.
							 */
							const savedRecord = await onSubmit( {
								content: inputComment,
							} );
							if ( savedRecord ) {
								selectNote( savedRecord.id );
								focusNoteThread(
									savedRecord.id,
									sidebarRef.current
								);
							}
							return savedRecord;
						} finally {
							isSubmittingRef.current = false;
						}
					} }
					onCancel={ unselectNote }
					labels={ {
						input: __( 'New note' ),
						placeholder: __( 'Add a note or @ mention' ),
					} }
				/>
			</NoteCard>
		</FloatingContainer>
	);
}
