/**
 * WordPress dependencies
 */
import { useState, useRef } from '@wordpress/element';
import {
	__experimentalHStack as HStack,
	Button,
	TextareaControl,
} from '@wordpress/components';
import { _x, __ } from '@wordpress/i18n';
import { useInstanceId, useFocusOnMount } from '@wordpress/compose';

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

	const textareaRef = useRef( null );
	const instanceId = useInstanceId( CommentForm );
	const textareaId = `comment-textarea-${ instanceId }`;
	const focusOnMountRef = useFocusOnMount();

	return (
		<>
			<div ref={ focusOnMountRef }>
				<TextareaControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					value={ inputComment ?? '' }
					onChange={ setInputComment }
					label={ __( 'Comment' ) }
					hideLabelFromVision
					id={ textareaId }
					ref={ textareaRef }
				/>
			</div>
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
