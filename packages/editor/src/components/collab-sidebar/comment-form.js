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

/**
 * Internal dependencies
 */
import { sanitizeCommentString } from './utils';

/**
 * EditComment component.
 *
 * @param {Object}   props                  - The component props.
 * @param {Function} props.onSubmit         - The function to call when updating the comment.
 * @param {Function} props.onCancel         - The function to call when canceling the comment update.
 * @param {Object}   props.thread           - The comment thread object.
 * @param {string}   props.submitButtonText - The text to display on the submit button.
 * @param {string?}  props.labelText        - The label text for the comment input.
 * @param {Function} props.reflowComments   - The function to call when the comment is updated.
 * @return {React.ReactNode} The CommentForm component.
 */
function CommentForm( {
	onSubmit,
	onCancel,
	thread,
	submitButtonText,
	labelText,
	reflowComments,
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
		>
			<VisuallyHidden as="label" htmlFor={ inputId }>
				{ labelText ?? __( 'Comment' ) }
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
			/>
			<HStack spacing="2" justify="flex-end" wrap>
				<Button size="compact" variant="tertiary" onClick={ onCancel }>
					<Truncate>{ __( 'Cancel' ) }</Truncate>
				</Button>
				<Button
					size="compact"
					accessibleWhenDisabled
					variant="primary"
					onClick={ () => {
						onSubmit( inputComment );
						setInputComment( '' );
					} }
					disabled={ isDisabled }
				>
					<Truncate>{ submitButtonText }</Truncate>
				</Button>
			</HStack>
		</VStack>
	);
}

export default CommentForm;
