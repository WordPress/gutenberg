/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import {
	__experimentalHStack as HStack,
	Button,
	TextareaControl,
} from '@wordpress/components';
import { _x, __ } from '@wordpress/i18n';

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

	return (
		<>
			<TextareaControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				value={ inputComment ?? '' }
				onChange={ setInputComment }
				label={ __( 'Comment' ) }
				hideLabelFromVision
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
