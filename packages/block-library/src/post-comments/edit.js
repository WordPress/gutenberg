/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	AlignmentControl,
	BlockControls,
	Warning,
	useBlockProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { __, sprintf } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { useEntityProp, store as coreStore } from '@wordpress/core-data';
import { useDisabled } from '@wordpress/compose';
import { createInterpolateElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import CommentsForm from '../post-comments-form/form';

export default function PostCommentsEdit( {
	attributes: { textAlign },
	setAttributes,
	context: { postType, postId },
} ) {
	let [ postTitle ] = useEntityProp( 'postType', postType, 'title', postId );
	postTitle = postTitle || __( 'Post Title' );

	const [ commentStatus ] = useEntityProp(
		'postType',
		postType,
		'comment_status',
		postId
	);

	const { avatarURL, defaultCommentStatus } = useSelect(
		( select ) =>
			select( blockEditorStore ).getSettings()
				.__experimentalDiscussionSettings
	);

	const isSiteEditor = postType === undefined || postId === undefined;

	const postTypeSupportsComments = useSelect( ( select ) =>
		postType
			? !! select( coreStore ).getPostType( postType )?.supports.comments
			: false
	);

	let warning = __(
		'Post Comments block: This is just a placeholder, not a real comment. The final styling may differ because it also depends on the current theme. For better compatibility with the Block Editor, please consider replacing this block with the "Comments" block.'
	);
	let showPlaceholder = true;

	if ( ! isSiteEditor && 'open' !== commentStatus ) {
		if ( 'closed' === commentStatus ) {
			warning = sprintf(
				/* translators: 1: Post type (i.e. "post", "page") */
				__(
					'Post Comments block: Comments to this %s are not allowed.'
				),
				postType
			);
			showPlaceholder = false;
		} else if ( ! postTypeSupportsComments ) {
			warning = sprintf(
				/* translators: 1: Post type (i.e. "post", "page") */
				__(
					'Post Comments block: Comments for this post type (%s) are not enabled.'
				),
				postType
			);
			showPlaceholder = false;
		} else if ( 'open' !== defaultCommentStatus ) {
			warning = __( 'Post Comments block: Comments are not enabled.' );
			showPlaceholder = false;
		}
	}

	const blockProps = useBlockProps( {
		className: classnames( {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} ),
	} );

	const disabledRef = useDisabled();

	return (
		<>
			<BlockControls group="block">
				<AlignmentControl
					value={ textAlign }
					onChange={ ( nextAlign ) => {
						setAttributes( { textAlign: nextAlign } );
					} }
				/>
			</BlockControls>

			<div { ...blockProps }>
				<Warning>{ warning }</Warning>

				{ showPlaceholder && (
					<div
						className="wp-block-post-comments__placeholder"
						ref={ disabledRef }
					>
						<h3>
							{
								/* translators: %s: Post title. */
								sprintf( __( 'One response to %s' ), postTitle )
							}
						</h3>

						<div className="navigation">
							<div className="alignleft">
								<a href="#top">« { __( 'Older Comments' ) }</a>
							</div>
							<div className="alignright">
								<a href="#top">{ __( 'Newer Comments' ) } »</a>
							</div>
						</div>

						<ol className="commentlist">
							<li className="comment even thread-even depth-1">
								<article className="comment-body">
									<footer className="comment-meta">
										<div className="comment-author vcard">
											<img
												alt="Commenter Avatar"
												src={ avatarURL }
												className="avatar avatar-32 photo"
												height="32"
												width="32"
												loading="lazy"
											/>
											{ createInterpolateElement(
												sprintf(
													/* translators: %s: Comment author link. */
													__(
														'%s <span>says:</span>'
													),
													sprintf(
														'<cite><a>%s</a></cite>',
														__(
															'A WordPress Commenter'
														)
													)
												),
												{
													span: (
														<span className="says" />
													),
													a: (
														/* eslint-disable jsx-a11y/anchor-has-content */
														<a
															href="#top"
															className="url"
														/>
														/* eslint-enable jsx-a11y/anchor-has-content */
													),
													cite: (
														<cite className="fn" />
													),
												}
											) }
										</div>

										<div className="comment-metadata">
											<a href="#top">
												<time dateTime="2000-01-01T12:00:00+00:00">
													{ __(
														'January 1, 2000 at 12:00 am'
													) }
												</time>
											</a>{ ' ' }
											<span className="edit-link">
												<a
													className="comment-edit-link"
													href="#top"
												>
													{ __( 'Edit' ) }
												</a>
											</span>
										</div>
									</footer>

									<div className="comment-content">
										<p>
											{ __( 'Hi, this is a comment.' ) }
											<br />
											{ __(
												'To get started with moderating, editing, and deleting comments, please visit the Comments screen in the dashboard.'
											) }
											<br />
											{ createInterpolateElement(
												__(
													'Commenter avatars come from <a>Gravatar</a>'
												),
												{
													a: (
														/* eslint-disable-next-line jsx-a11y/anchor-has-content */
														<a href="https://gravatar.com/" />
													),
												}
											) }
										</p>
									</div>

									<div className="reply">
										<a
											className="comment-reply-link"
											href="#top"
											aria-label={ sprintf(
												/* translators: Comment reply button text. %s: Comment author name. */
												__( 'Reply to %s' ),
												__( 'A WordPress Commenter' )
											) }
										>
											{ __( 'Reply' ) }
										</a>
									</div>
								</article>
							</li>
						</ol>

						<div className="navigation">
							<div className="alignleft">
								<a href="#top">« { __( 'Older Comments' ) }</a>
							</div>
							<div className="alignright">
								<a href="#top">{ __( 'Newer Comments' ) } »</a>
							</div>
						</div>

						<CommentsForm />
					</div>
				) }
			</div>
		</>
	);
}
