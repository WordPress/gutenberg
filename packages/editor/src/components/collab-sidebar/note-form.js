/**
 * External dependencies
 */
import TextareaAutosize from 'react-autosize-textarea';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import {
	__experimentalTruncate as Truncate,
	Button,
} from '@wordpress/components';
import { Stack, VisuallyHidden } from '@wordpress/ui';
import { __ } from '@wordpress/i18n';
import { useInstanceId } from '@wordpress/compose';
import { isKeyboardEvent } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { sanitizeNoteContent } from './utils';

/**
 * Form for writing a note, a reply, or an edit to an existing note.
 *
 * @param {Object}   props
 * @param {Function} props.onSubmit Called with the input value on submit.
 * @param {Function} props.onCancel Called when the form is dismissed.
 * @param {Object}   [props.note]   Existing note when editing; omitted for new notes and replies.
 * @param {Object}   [props.labels] Optional `input`/`submit` label overrides.
 */
export function NoteForm( { onSubmit, onCancel, note, labels } ) {
	const [ inputComment, setInputComment ] = useState(
		note?.content?.raw ?? ''
	);

	const inputId = useInstanceId( NoteForm, 'comment-input' );
	const isDisabled =
		inputComment === note?.content?.raw ||
		! sanitizeNoteContent( inputComment ).length;

	return (
		<Stack
			className="editor-collab-sidebar-panel__note-form"
			direction="column"
			gap="lg"
			render={ <form /> }
			onSubmit={ ( event ) => {
				event.preventDefault();
				onSubmit( inputComment );
				setInputComment( '' );
			} }
		>
			{ /* eslint-disable-next-line jsx-a11y/label-has-associated-control */ }
			<VisuallyHidden render={ <label htmlFor={ inputId } /> }>
				{ labels?.input ?? __( 'Note' ) }
			</VisuallyHidden>
			<TextareaAutosize
				id={ inputId }
				value={ inputComment ?? '' }
				onChange={ ( comment ) =>
					setInputComment( comment.target.value )
				}
				rows={ 1 }
				maxRows={ 20 }
				onKeyDown={ ( event ) => {
					if (
						isKeyboardEvent.primary( event, 'Enter' ) &&
						! isDisabled
					) {
						event.target.parentNode.requestSubmit();
					}

					if ( event.key === 'Escape' ) {
						event.preventDefault();
						// Passing event for reply forms.
						onCancel( event );
					}
				} }
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
