/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { __, sprintf } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { useEntityProp } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import CommentsForm from '../../post-comments-form/form';

export default function PostCommentsPlaceholder( { postType, postId } ) {
	let [ postTitle ] = useEntityProp( 'postType', postType, 'title', postId );
	postTitle = postTitle || __( 'Post Title' );

	const { avatarURL } = useSelect(
		( select ) =>
			select( blockEditorStore ).getSettings()
				.__experimentalDiscussionSettings
	);

	return (
		<div className="wp-block-comments__legacy-placeholder" inert="true">
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
								<b className="fn">
									<a href="#top" className="url">
										{ __( 'A WordPress Commenter' ) }
									</a>
								</b>{ ' ' }
								<span className="says">{ __( 'says' ) }:</span>
							</div>

							<div className="comment-metadata">
								<a href="#top">
									<time dateTime="2000-01-01T00:00:00+00:00">
										{ __( 'January 1, 2000 at 00:00 am' ) }
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
								{ __( 'Commenter avatars come from' ) }{ ' ' }
								<a href="https://gravatar.com/">Gravatar</a>.
							</p>
						</div>

						<div className="reply">
							<a
								className="comment-reply-link"
								href="#top"
								aria-label="Reply to A WordPress Commenter"
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

			<CommentsForm postId={ postId } postType={ postType } />
		</div>
	);
}
