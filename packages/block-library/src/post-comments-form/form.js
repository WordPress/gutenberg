/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __, _x, sprintf } from '@wordpress/i18n';
import {
	Warning,
	store as blockEditorStore,
	__experimentalGetElementClassName,
} from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { useDisabled, useInstanceId } from '@wordpress/compose';
import { useEntityProp, store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { Fragment } from '@wordpress/element';

const CommentsFormPlaceholder = () => {
	const disabledFormRef = useDisabled();
	const instanceId = useInstanceId( CommentsFormPlaceholder );

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

const CommentsForm = ( { postId, postType } ) => {
	const [ commentStatus, setCommentStatus ] = useEntityProp(
		'postType',
		postType,
		'comment_status',
		postId
	);

	const isSiteEditor = postType === undefined || postId === undefined;

	const { defaultCommentStatus } = useSelect(
		( select ) =>
			select( blockEditorStore ).getSettings()
				.__experimentalDiscussionSettings
	);

	const postTypeSupportsComments = useSelect( ( select ) =>
		postType
			? !! select( coreStore ).getPostType( postType )?.supports.comments
			: false
	);

	let warning = false;
	let actions;
	let showPlaceholder = true;

	if ( ! isSiteEditor && 'open' !== commentStatus ) {
		if ( 'closed' === commentStatus ) {
			warning = __(
				'Post Comments Form block: Comments are not enabled for this item.'
			);

			actions = [
				<Button
					key="enableComments"
					onClick={ () => setCommentStatus( 'open' ) }
					variant="primary"
				>
					{ _x(
						'Enable comments',
						'action that affects the current post'
					) }
				</Button>,
			];
			showPlaceholder = false;
		} else if ( ! postTypeSupportsComments ) {
			warning = sprintf(
				/* translators: 1: Post type (i.e. "post", "page") */
				__(
					'Post Comments Form block: Comments are not enabled for this post type (%s).'
				),
				postType
			);
			showPlaceholder = false;
		} else if ( 'open' !== defaultCommentStatus ) {
			warning = __(
				'Post Comments Form block: Comments are not enabled.'
			);
			showPlaceholder = false;
		}
	}

	return (
		<Fragment>
			{ warning && <Warning actions={ actions }>{ warning }</Warning> }

			{ showPlaceholder ? <CommentsFormPlaceholder /> : null }
		</Fragment>
	);
};

export default CommentsForm;
