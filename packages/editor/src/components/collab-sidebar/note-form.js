/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import {
	__experimentalTruncate as Truncate,
	Button,
} from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import { __ } from '@wordpress/i18n';
import { useInstanceId } from '@wordpress/compose';
import { isKeyboardEvent } from '@wordpress/keycodes';
import { privateApis as dataviewsPrivateApis } from '@wordpress/dataviews';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';

/**
 * Internal dependencies
 */
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
 * `core/link` also carries `@` mentions: the completer inserts a mention as a
 * link to the user's author page with a `wp-note-mention user-N` class, which
 * rich text preserves as an unregistered attribute of the link format.
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
		try {
			/*
			 * The note actions resolve with the saved record on success and
			 * `undefined` on failure (they surface their own error notice),
			 * so only discard the draft once the save actually succeeded.
			 */
			const result = await onSubmit( submitted );
			if ( result !== undefined ) {
				/*
				 * The field stays editable while the request is in flight, so
				 * keep anything typed since; clearing unconditionally would
				 * discard it.
				 */
				setInputComment( ( current ) =>
					current === submitted ? '' : current
				);
			}
		} catch {
			// Keep the draft so the user can retry.
		} finally {
			setIsSubmitting( false );
		}
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

				if ( event.key === 'Escape' ) {
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
				<Button size="compact" variant="tertiary" onClick={ onCancel }>
					<Truncate>{ __( 'Cancel' ) }</Truncate>
				</Button>
				<Button
					size="compact"
					accessibleWhenDisabled
					variant="primary"
					type="submit"
					disabled={ isDisabled }
				>
					<Truncate>{ labels?.submit ?? __( 'Add note' ) }</Truncate>
				</Button>
			</Stack>
		</Stack>
	);
}
