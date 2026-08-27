import { useState } from '@wordpress/element';
import {
	__experimentalTruncate as Truncate,
	Button,
} from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { useInstanceId } from '@wordpress/compose';
import { displayShortcut, isKeyboardEvent } from '@wordpress/keycodes';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';
import { sanitizeNoteContent } from './utils';
import noteMentionCompleter from './note-mention-completer';
import { unlock } from '../../lock-unlock';
import { store as editorStore } from '../../store';
/*
 * The rich text form field wires `@wordpress/rich-text` into the presentational
 * `ContentEditableControl` shell from `@wordpress/components`. The notes
 * sidebar is its only consumer, so it lives next to it.
 */
import RichTextControl from './rich-text-control';

/*
 * `@` mentions are not on this list: the completer inserts a mention as a
 * `<span class="wp-note-mention user-N">` chip, which rich text preserves as
 * unregistered markup, so no format is involved and the Link UI never picks a
 * mention up as an editable link.
 */
const ALLOWED_NOTE_FORMATS = [
	'core/bold',
	'core/italic',
	'core/link',
	'core/code',
];

const NOTE_COMPLETERS = [ noteMentionCompleter ];

export function NoteForm( { onSubmit, onCancel, note, labels, draftKey } ) {
	const { setNoteDraft } = unlock( useDispatch( editorStore ) );
	const { getNoteDraft } = unlock( useSelect( editorStore ) );
	/*
	 * Forms with a `draftKey` stash unsent content in the editor store, so a
	 * draft survives the form unmounting (e.g. when selection moves to
	 * another block) and each key restores its own draft independently.
	 */
	const [ inputComment, setInputComment ] = useState(
		() =>
			( draftKey ? getNoteDraft( draftKey ) : '' ) ||
			note?.content?.raw ||
			''
	);
	const [ isSubmitting, setIsSubmitting ] = useState( false );

	const updateComment = ( value ) => {
		setInputComment( value );
		if ( draftKey ) {
			setNoteDraft( draftKey, value );
		}
	};

	const inputId = useInstanceId( NoteForm, 'comment-input' );
	const trimmedPlainText = sanitizeNoteContent( stripHTML( inputComment ) );
	const isDisabled =
		isSubmitting ||
		inputComment === note?.content?.raw ||
		! trimmedPlainText.length;

	async function submit() {
		if ( isDisabled ) {
			return;
		}
		setIsSubmitting( true );
		const submitted = inputComment;

		/*
		 * The note actions resolve with the saved record on success and
		 * `undefined` on failure (they surface their own error notice),
		 * so only discard the draft once the save actually succeeded.
		 */
		const result = await onSubmit( submitted );
		if ( result ) {
			/*
			 * The field stays editable while the request is in flight, so
			 * keep anything typed since; clearing unconditionally would
			 * discard it.
			 */
			setInputComment( ( current ) =>
				current === submitted ? '' : current
			);
			if ( draftKey && getNoteDraft( draftKey ) === submitted ) {
				setNoteDraft( draftKey, '' );
			}
		}

		setIsSubmitting( false );
	}

	function handleCancel( event ) {
		// Cancelling is an explicit discard, unlike dismissing the form.
		if ( draftKey ) {
			setNoteDraft( draftKey, '' );
		}
		onCancel( event );
	}

	return (
		<Stack
			className="editor-collab-sidebar-panel__note-form"
			direction="column"
			gap="lg"
			render={ <form /> }
			onSubmit={ ( event ) => {
				event.preventDefault();
				submit();
			} }
			onKeyDown={ ( event ) => {
				if ( isKeyboardEvent.primary( event, 'Enter' ) ) {
					event.preventDefault();
					submit();
					return;
				}

				if ( event.key === 'Escape' && ! event.defaultPrevented ) {
					event.preventDefault();
					// Passing event for reply forms.
					handleCancel( event );
				}
			} }
		>
			<RichTextControl
				id={ inputId }
				label={ labels?.input ?? __( 'Note' ) }
				hideLabelFromVision
				value={ inputComment }
				onChange={ updateComment }
				placeholder={ labels?.placeholder }
				allowedFormats={ ALLOWED_NOTE_FORMATS }
				completers={ NOTE_COMPLETERS }
			/>
			<Stack
				direction="row"
				align="center"
				justify="flex-end"
				gap="sm"
				wrap="wrap"
			>
				<Button
					size="compact"
					variant="tertiary"
					onClick={ handleCancel }
					shortcut="Escape"
				>
					<Truncate>{ __( 'Cancel' ) }</Truncate>
				</Button>
				<Button
					size="compact"
					accessibleWhenDisabled
					variant="primary"
					type="submit"
					disabled={ isDisabled }
					shortcut={ displayShortcut.primary( 'Enter' ) }
				>
					<Truncate>{ labels?.submit ?? __( 'Add note' ) }</Truncate>
				</Button>
			</Stack>
		</Stack>
	);
}
