/**
 * WordPress dependencies
 */
import { useState, useRef, useEffect } from '@wordpress/element';
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
	const editableElementRef = useRef( null );

	useEffect( () => {
		if (
			editableElementRef.current &&
			editableElementRef.current.textContent !== inputComment
		) {
			editableElementRef.current.textContent = inputComment;
		}
	}, [ inputComment ] );

	return (
		<>
			<VisuallyHidden as="label" htmlFor={ inputId }>
				{ __( 'Comment' ) }
			</VisuallyHidden>
			<pre
				ref={ editableElementRef }
				contentEditable="plaintext-only"
				// eslint-disable-next-line jsx-a11y/no-noninteractive-element-to-interactive-role
				role="textbox"
				onInput={ () => {
					if ( editableElementRef.current ) {
						setInputComment(
							editableElementRef.current.textContent
						);
					}
				} }
				className="editor-collab-sidebar-panel__comment-form-editable-area"
				id={ inputId }
				data-placeholder={ __( 'Write a comment…' ) }
			/>
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
