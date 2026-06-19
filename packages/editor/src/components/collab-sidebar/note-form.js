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
import { RichTextControl } from '@wordpress/rich-text-control';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import { sanitizeNoteContent } from './utils';

const ALLOWED_NOTE_FORMATS = [
	'core/bold',
	'core/italic',
	'core/link',
	'core/code',
];

export function NoteForm( { onSubmit, onCancel, note, labels, focusOnMount } ) {
	const [ inputComment, setInputComment ] = useState(
		note?.content?.raw ?? ''
	);

	const inputId = useInstanceId( NoteForm, 'comment-input' );
	const trimmedPlainText = sanitizeNoteContent( stripHTML( inputComment ) );
	const isDisabled =
		inputComment === note?.content?.raw || ! trimmedPlainText.length;

	function submit() {
		if ( isDisabled ) {
			return;
		}
		onSubmit( inputComment );
		setInputComment( '' );
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
				// Opt-in focus: the standalone control has no block-editor
				// selection to inherit focus from. Callers that open the form
				// as a primary action (e.g. a brand-new note) pass
				// `focusOnMount` so the caret lands in the field immediately;
				// the reply form deliberately omits it so selecting a thread
				// doesn't yank focus away from thread keyboard navigation.
				focusOnMount={ focusOnMount }
				value={ inputComment }
				onChange={ setInputComment }
				allowedFormats={ ALLOWED_NOTE_FORMATS }
				placeholder={ labels?.input ?? __( 'Note' ) }
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
