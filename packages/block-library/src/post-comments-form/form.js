/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { __experimentalGetElementClassName } from '@wordpress/block-editor';
import { useDisabled, useInstanceId } from '@wordpress/compose';

const CommentsForm = () => {
	const disabledFormRef = useDisabled();
	const instanceId = useInstanceId( CommentsForm );

	return (
		<div className="comment-respond">
			<h3 className="comment-reply-title">{ __( 'Leave a Reply' ) }</h3>
			<form noValidate className="comment-form" ref={ disabledFormRef }>
				<p>
					<label htmlFor={ `comment-${ instanceId }` }>
						{ __( 'Comment' ) }
					</label>
					<textarea
						id={ `comment-${ instanceId }` }
						name="comment"
						cols="45"
						rows="8"
					/>
				</p>
				<p className="form-submit wp-block-button">
					<input
						name="submit"
						type="submit"
						className={ classnames(
							'submit',
							'wp-block-button__link',
							__experimentalGetElementClassName( 'button' )
						) }
						label={ __( 'Post Comment' ) }
						value={ __( 'Post Comment' ) }
					/>
				</p>
			</form>
		</div>
	);
};

export default CommentsForm;
