/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */

import { ExternalLink, Button, ClipboardButton } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { Component, createRef } from '@wordpress/element';
import { withSelect } from '@wordpress/data';
import { safeDecodeURIComponent } from '@wordpress/url';

/**
 * Internal dependencies
 */
import PostScheduleLabel from '../post-schedule/label';

class PostPublishModalPostpublish extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			showCopyConfirmation: false,
		};
		this.onCopy = this.onCopy.bind( this );
		this.onSelectInput = this.onSelectInput.bind( this );
		this.postLink = createRef();
	}

	componentDidMount() {
		if ( this.props.focusOnMount ) {
			this.postLink.current.focus();
		}
	}

	componentWillUnmount() {
		clearTimeout( this.dismissCopyConfirmation );
	}

	onCopy() {
		this.setState( {
			showCopyConfirmation: true,
		} );

		clearTimeout( this.dismissCopyConfirmation );
		this.dismissCopyConfirmation = setTimeout( () => {
			this.setState( {
				showCopyConfirmation: false,
			} );
		}, 4000 );
	}

	onSelectInput( event ) {
		event.target.select();
	}

	render() {
		const { children, isScheduled, post, postType } = this.props;
		const postLabel = get( postType, [ 'labels', 'singular_name' ] );
		const viewPostLabel = get( postType, [ 'labels', 'view_item' ] );

		const postPublishNonLinkHeader = isScheduled ?
			<>{ __( 'is now scheduled. It will go live on' ) } <PostScheduleLabel />.</> :
			__( 'is now live.' );

		return (
			<div className="post-publish-modal__postpublish">
				<div className="editor-post-publish-modal-panel">
					<a ref={ this.postLink } href={ post.link }>{ post.title || __( '(no title)' ) }</a> { postPublishNonLinkHeader }
				</div>
				<div className="editor-post-publish-modal-panel">
					{
						sprintf(
							/* translators: %s: post type singular name */
							__( 'Link to your %s:' ), postLabel
						)
					}
					<br />
					<ExternalLink
						className="post-publish-modal__postpublish-post-address"
						href={ safeDecodeURIComponent( post.link ) }
						target="_blank"
						ref={ ( linkElement ) => this.linkElement = linkElement }
					>
						{ safeDecodeURIComponent( post.link ) }
						&lrm;
					</ExternalLink>
				</div>
				<div className="editor-post-publish-modal-panel">
					{ ! isScheduled && (
						<Button isDefault href={ post.link }>
							{ viewPostLabel }
						</Button>
					) }

					<ClipboardButton
						isDefault text={ post.link }
						onCopy={ this.onCopy }
					>
						{ this.state.showCopyConfirmation ? __( 'Copied!' ) : __( 'Copy Link' ) }
					</ClipboardButton>
				</div>
				{ children }
			</div>
		);
	}
}

export default withSelect( ( select ) => {
	const { getEditedPostAttribute, getCurrentPost, isCurrentPostScheduled } = select( 'core/editor' );
	const { getPostType } = select( 'core' );

	return {
		post: getCurrentPost(),
		postType: getPostType( getEditedPostAttribute( 'type' ) ),
		isScheduled: isCurrentPostScheduled(),
	};
} )( PostPublishModalPostpublish );
