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
				/*
				 * Prevent blur from closing the form while the async submit
				 * is in progress. Clicking "Add note" moves focus away,
				 * triggering blur before onSubmit completes.
				 */
				if ( isSubmittingRef.current ) {
					return;
				}
				const container = event.currentTarget;
				const dismiss = () => {
					toggleBlockSpotlight( clientId, false );
					selectNote( undefined );
				};
				/*
				 * A known target outside the form closes it, except a format
				 * popover (e.g. the Cmd+K link UI) which portals out of the
				 * form container and so reports a related target inside
				 * `.components-popover` rather than `currentTarget`.
				 */
				if ( event.relatedTarget ) {
					if ( container.contains( event.relatedTarget ) ) {
						return;
					}
					if (
						event.relatedTarget.closest( '.components-popover' )
					) {
						return;
					}
					dismiss();
					return;
				}
				/*
				 * With no relatedTarget the blur is ambiguous: rich-text
				 * re-renders briefly drop focus to the body while typing, but a
				 * click on the empty document body also lands here. Re-check on
				 * the next frame where focus actually settled and dismiss only
				 * when it has truly left the form.
				 */
				container.ownerDocument.defaultView.requestAnimationFrame(
					() => {
						const active = container.ownerDocument.activeElement;
						if ( active && container.contains( active ) ) {
							return;
						}
						if (
							active &&
							active.closest( '.components-popover' )
						) {
							return;
						}
						dismiss();
					}
				);
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
					focusOnMount
				/>
			</NoteCard>
		</FloatingContainer>
	);
}
