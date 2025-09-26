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
	const isDisabled =
		inputComment === thread?.content?.raw ||
		! sanitizeCommentString( inputComment ).length;

	return (
		<VStack
			className="editor-collab-sidebar-panel__comment-form"
			spacing="4"
		>
			<VisuallyHidden as="label" htmlFor={ inputId }>
				{ __( 'Comment' ) }
			</VisuallyHidden>
			<TextareaAutosize
				id={ inputId }
				value={ inputComment ?? '' }
				onChange={ ( comment ) =>
					setInputComment( comment.target.value )
				}
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
