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
	__experimentalVStack as VStack,
	Button,
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
 * @param {Object}    props                  - The component props.
 * @param {Function}  props.onSubmit         - The function to call when updating the comment.
 * @param {Function}  props.onCancel         - The function to call when canceling the comment update.
 * @param {Object}    props.thread           - The comment thread object.
 * @param {string}    props.submitButtonText - The text to display on the submit button.
 * @param {string?}   props.placeholderText  - The placeholder text for the comment input.
 * @param {number?}   props.rows             - The number of rows for the comment input.
 * @param {string?}   props.labelText        - Custom label text for accessibility.
 * @param {Function?} props.onReturnToBlock  - Function to navigate back to the related block.
 * @return {React.ReactNode} The CommentForm component.
 */
function CommentForm( {
	onSubmit,
	onCancel,
	thread,
	submitButtonText,
	placeholderText,
	rows = 4,
	labelText,
	onReturnToBlock,
} ) {
	const [ inputComment, setInputComment ] = useState(
		thread?.content?.raw ?? ''
	);

	const inputId = useInstanceId( CommentForm, 'comment-input' );

	return (
		<VStack spacing="3">
			<label
				htmlFor={ inputId }
				className="editor-collab-sidebar-panel__comment-label"
			>
				{ labelText || __( 'Comment' ) }
			</label>
			<TextareaAutosize
				id={ inputId }
				value={ inputComment ?? '' }
				onChange={ ( comment ) =>
					setInputComment( comment.target.value )
				}
				rows={ rows }
				maxRows={ 20 }
				placeholder={ placeholderText || '' }
			></TextareaAutosize>
			<HStack spacing="3" justify="flex-start" wrap>
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
				{ onReturnToBlock && (
					<Button
						__next40pxDefaultSize
						variant="tertiary"
						onClick={ onReturnToBlock }
						text={ _x(
							'Return to Block',
							'Navigate back to the related block'
						) }
					/>
				) }
			</HStack>
		</VStack>
	);
}

export default CommentForm;
