/**
 * External dependencies
 */
import TextareaAutosize from 'react-autosize-textarea';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import {
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	__experimentalTruncate as Truncate,
	Button,
	VisuallyHidden,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useInstanceId, useDebounce } from '@wordpress/compose';
import { isKeyboardEvent } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { sanitizeCommentString, noop } from './utils';

function CommentForm( {
	onSubmit,
	onCancel,
	thread,
	submitButtonText,
	labelText,
	reflowComments = noop,
} ) {
	const [ inputComment, setInputComment ] = useState(
		thread?.content?.raw ?? ''
	);

	// Regularly trigger a reflow as the user types since the textarea may grow or shrink.
	const debouncedCommentUpdated = useDebounce( reflowComments, 100 );

	const updateComment = ( value ) => {
		setInputComment( value );
	};

	const inputId = useInstanceId( CommentForm, 'comment-input' );
	const isDisabled =
		inputComment === thread?.content?.raw ||
		! sanitizeCommentString( inputComment ).length;

	return (
		<VStack
			className="editor-collab-sidebar-panel__comment-form"
			spacing="4"
			as="form"
			onSubmit={ ( event ) => {
				event.preventDefault();
				onSubmit( inputComment );
				setInputComment( '' );
			} }
		>
			<VisuallyHidden as="label" htmlFor={ inputId }>
				{ labelText ?? __( 'Note' ) }
			</VisuallyHidden>
			<TextareaAutosize
				id={ inputId }
				value={ inputComment ?? '' }
				onChange={ ( comment ) => {
					updateComment( comment.target.value );
					debouncedCommentUpdated();
				} }
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
			<HStack spacing="2" justify="flex-end" wrap>
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
					<Truncate>{ submitButtonText }</Truncate>
				</Button>
			</HStack>
		</VStack>
	);
}

export default CommentForm;
