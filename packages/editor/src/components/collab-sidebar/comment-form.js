/**
 * External dependencies
 */
import TextareaAutosize from 'react-autosize-textarea';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import {
	__experimentalHStack as HStack,
	Button,
	VisuallyHidden,
} from '@wordpress/components';
import { _x, __ } from '@wordpress/i18n';
import { useInstanceId } from '@wordpress/compose';

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
 * @return {React.ReactNode} The CommentForm component.
 */
function CommentForm( { onSubmit, onCancel, thread, submitButtonText } ) {
	const [ inputComment, setInputComment ] = useState(
		thread?.content?.raw ?? ''
	);

	const inputId = useInstanceId( CommentForm, 'comment-input' );

	return (
		<>
			<VisuallyHidden as="label" htmlFor={ inputId }>
				{ __( 'Comment' ) }
			</VisuallyHidden>
			<TextareaAutosize
				id={ inputId }
				value={ inputComment ?? '' }
				onChange={ ( comment ) =>
					setInputComment( comment.target.value )
				}
				rows={ 4 }
				maxRows={ 20 }
			></TextareaAutosize>
			<HStack alignment="left" spacing="3" justify="flex-start">
				<Button
					__next40pxDefaultSize
					accessibleWhenDisabled
					variant="primary"
					onClick={ () => {
						onSubmit( inputComment );
						setInputComment( '' );
					} }
					disabled={
						0 === sanitizeCommentString( inputComment ).length
					}
					text={ submitButtonText }
				/>
				<Button
					__next40pxDefaultSize
					variant="tertiary"
					onClick={ onCancel }
					text={ _x( 'Cancel', 'Cancel comment button' ) }
				/>
			</HStack>
		</>
	);
}

export default CommentForm;
