/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __, _x, sprintf } from '@wordpress/i18n';
import {
	Warning,
	store as blockEditorStore,
	__experimentalGetElementClassName,
	RichText,
} from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { useEntityProp, store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';

const CommentsFormPlaceholder = ( { commentFormTitleActions } ) => {
	const instanceId = useInstanceId( CommentsFormPlaceholder );

	let isCommentFormTitleActionsEmpty = false;

	if ( ! commentFormTitleActions ) {
		isCommentFormTitleActionsEmpty = true;

		commentFormTitleActions = {
			title: __( 'Leave a reply' ),
			setTitle: null,
		};
	} else if (
		null === commentFormTitleActions.title ||
		undefined === commentFormTitleActions.title
	) {
		commentFormTitleActions.title = '';
	} else if (
		null === commentFormTitleActions.setTitle ||
		undefined === commentFormTitleActions.setTitle
	) {
		commentFormTitleActions.setTitle = null;
	}

	return (
		<div className="comment-respond">
			<RichText
				tagName="h3"
				className={
					'comment-reply-title' +
					( isCommentFormTitleActionsEmpty ? ' disabled' : '' )
				}
				placeholder={ __( 'Leave a reply' ) }
				value={ commentFormTitleActions.title }
				onChange={ ( text ) => {
					if ( commentFormTitleActions.setTitle !== null ) {
						commentFormTitleActions.setTitle( text );
					}
				} }
			/>
			<form
				noValidate
				className="comment-form"
				onSubmit={ ( event ) => event.preventDefault() }
			>
				<p>
					<label htmlFor={ `comment-${ instanceId }` }>
						{ __( 'Comment' ) }
					</label>
					<textarea
						id={ `comment-${ instanceId }` }
						name="comment"
						cols="45"
						rows="8"
						readOnly
					/>
				</p>
				<p className="form-submit wp-block-button">
					<input
						name="submit"
						type="submit"
						className={ clsx(
							'wp-block-button__link',
							__experimentalGetElementClassName( 'button' )
						) }
						label={ __( 'Post Comment' ) }
						value={ __( 'Post Comment' ) }
						aria-disabled="true"
					/>
				</p>
			</form>
		</div>
	);
};

const CommentsForm = ( { postId, postType, commentFormTitleActions } ) => {
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

	if ( ! isSiteEditor && 'open' !== commentStatus ) {
		if ( 'closed' === commentStatus ) {
			const actions = [
				<Button
					__next40pxDefaultSize
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
			return (
				<Warning actions={ actions }>
					{ __(
						'Post Comments Form block: Comments are not enabled for this item.'
					) }
				</Warning>
			);
		} else if ( ! postTypeSupportsComments ) {
			return (
				<Warning>
					{ sprintf(
						/* translators: 1: Post type (i.e. "post", "page") */
						__(
							'Post Comments Form block: Comments are not enabled for this post type (%s).'
						),
						postType
					) }
				</Warning>
			);
		} else if ( 'open' !== defaultCommentStatus ) {
			return (
				<Warning>
					{ __(
						'Post Comments Form block: Comments are not enabled.'
					) }
				</Warning>
			);
		}
	}

	return (
		<CommentsFormPlaceholder
			commentFormTitleActions={ commentFormTitleActions }
		/>
	);
};

export default CommentsForm;
