/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { withDispatch, withSelect } from '@wordpress/data';
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { compose } from '@wordpress/compose';
import { ClipboardButton, Button, ExternalLink } from '@wordpress/components';
import { safeDecodeURI } from '@wordpress/url';

/**
 * Internal Dependencies
 */
import PostPermalinkEditor from './editor.js';
import { getWPAdminURL, cleanForSlug } from '../../utils/url';

class PostPermalink extends Component {
	constructor() {
		super( ...arguments );

		this.addVisibilityCheck = this.addVisibilityCheck.bind( this );
		this.onVisibilityChange = this.onVisibilityChange.bind( this );

		this.state = {
			isCopied: false,
			isEditingPermalink: false,
		};
	}

	addVisibilityCheck() {
		window.addEventListener( 'visibilitychange', this.onVisibilityChange );
	}

	onVisibilityChange() {
		const { isEditable, refreshPost } = this.props;
		// If the user just returned after having clicked the "Change Permalinks" button,
		// fetch a new copy of the post from the server, just in case they enabled permalinks.
		if ( ! isEditable && 'visible' === document.visibilityState ) {
			refreshPost();
		}
	}

	componentDidUpdate( prevProps, prevState ) {
		// If we've just stopped editing the permalink, focus on the new permalink.
		if ( prevState.isEditingPermalink && ! this.state.isEditingPermalink ) {
			this.linkElement.focus();
		}
	}

	componentWillUnmount() {
		window.removeEventListener( 'visibilitychange', this.addVisibilityCheck );
	}

	render() {
		const { isNew, postLink, permalinkParts, postSlug, postTitle, postID, isEditable, isPublished } = this.props;

		if ( isNew || ! postLink ) {
			return null;
		}

		const { isCopied, isEditingPermalink } = this.state;
		const ariaLabel = isCopied ? __( 'Permalink copied' ) : __( 'Copy the permalink' );

		const { prefix, suffix } = permalinkParts;
		const slug = postSlug || cleanForSlug( postTitle ) || postID;
		const samplePermalink = ( isEditable ) ? prefix + slug + suffix : prefix;

		return (
			<div className="editor-post-permalink">
				<ClipboardButton
					className={ classnames( 'editor-post-permalink__copy', { 'is-copied': isCopied } ) }
					text={ samplePermalink }
					label={ ariaLabel }
					onCopy={ () => this.setState( { isCopied: true } ) }
					aria-disabled={ isCopied }
					icon="admin-links"
				/>

				<span className="editor-post-permalink__label">{ __( 'Permalink:' ) }</span>

				{ ! isEditingPermalink &&
					<ExternalLink
						className="editor-post-permalink__link"
						href={ ! isPublished ? postLink : samplePermalink }
						target="_blank"
						ref={ ( linkElement ) => this.linkElement = linkElement }
					>
						{ safeDecodeURI( samplePermalink ) }
						&lrm;
					</ExternalLink>
				}

				{ isEditingPermalink &&
					<PostPermalinkEditor
						slug={ slug }
						onSave={ () => this.setState( { isEditingPermalink: false } ) }
					/>
				}

				{ isEditable && ! isEditingPermalink &&
					<Button
						className="editor-post-permalink__edit"
						isLarge
						onClick={ () => this.setState( { isEditingPermalink: true } ) }
					>
						{ __( 'Edit' ) }
					</Button>
				}

				{ ! isEditable &&
					<Button
						className="editor-post-permalink__change"
						isLarge
						href={ getWPAdminURL( 'options-permalink.php' ) }
						onClick={ this.addVisibilityCheck }
						target="_blank"
					>
						{ __( 'Change Permalinks' ) }
					</Button>
				}
			</div>
		);
	}
}

export default compose( [
	withSelect( ( select ) => {
		const {
			isEditedPostNew,
			isPermalinkEditable,
			getCurrentPost,
			getPermalinkParts,
			getEditedPostAttribute,
			isCurrentPostPublished,
		} = select( 'core/editor' );

		const { id, link } = getCurrentPost();

		return {
			isNew: isEditedPostNew(),
			postLink: link,
			permalinkParts: getPermalinkParts(),
			postSlug: getEditedPostAttribute( 'slug' ),
			isEditable: isPermalinkEditable(),
			isPublished: isCurrentPostPublished(),
			postTitle: getEditedPostAttribute( 'title' ),
			postID: id,
		};
	} ),
	withDispatch( ( dispatch ) => {
		const { refreshPost } = dispatch( 'core/editor' );
		return { refreshPost };
	} ),
] )( PostPermalink );
