import { useState } from '@wordpress/element';
import {
	__experimentalTruncate as Truncate,
	Button,
} from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import { __ } from '@wordpress/i18n';
import { useInstanceId } from '@wordpress/compose';
import { displayShortcut, isKeyboardEvent } from '@wordpress/keycodes';
import { privateApis as dataviewsPrivateApis } from '@wordpress/dataviews';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';
import { unlock } from '../../lock-unlock';
import { sanitizeNoteContent } from './utils';
import noteMentionCompleter from './note-mention-completer';

/*
 * The rich text form field is assembled in `@wordpress/dataviews` on top of the
 * presentational `ContentEditableControl` shell in `@wordpress/components`; the
 * notes sidebar is its second consumer.
 */
const { RichTextControl } = unlock( dataviewsPrivateApis );

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

export function NoteForm( { onSubmit, onCancel, note, labels } ) {
	const [ inputComment, setInputComment ] = useState(
		note?.content?.raw ?? ''
	);
	const [ isSubmitting, setIsSubmitting ] = useState( false );

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
		}

		setIsSubmitting( false );
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
					onCancel( event );
				}
			} }
		>
			<RichTextControl
				id={ inputId }
				label={ labels?.input ?? __( 'Note' ) }
				hideLabelFromVision
				value={ inputComment }
				onChange={ setInputComment }
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
					onClick={ onCancel }
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
