/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */

import { Button, TextControl, ClipboardButton } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { Component, createRef } from '@wordpress/element';
import { withSelect } from '@wordpress/data';
import { safeDecodeURIComponent } from '@wordpress/url';

/**
 * Internal dependencies
 */
// import PostScheduleLabel from '../post-schedule/label';

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

	// componentDidMount() {
	// 	if ( this.props.focusOnMount ) {
	// 		this.postLink.current.focus();
	// 	}
	// }

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

		return (
			<div className="post-publish-modal__postpublish">
				<p className="post-publish-modal__postpublish-post-text">
					{
						sprintf(
							/* translators: %s: post type singular name */
							__( 'Great Work! You\'ve just published your first %s. You can review it here to check for any mistakes, or start on a new %s.' ), postLabel.toLowerCase(), postLabel.toLowerCase()
						)
					}
				</p>
				<div className="post-publish-modal__postpublish-post-address">
					<TextControl
						disabled
						className="post-publish-modal__postpublish-post-url"
						label={
							sprintf(
								/* translators: %s: post type singular name */
								__( 'Link to your %s:' ), postLabel
							)
						}
						value={ safeDecodeURIComponent( post.link ) }
					/>
					<ClipboardButton
						isDefault
						isLarge
						className="post-publish-modal__postpublish-post-copy"
						text={ post.link }
						onCopy={ this.onCopy }
					>
						{ this.state.showCopyConfirmation ? __( 'Copied!' ) : __( 'Copy Link' ) }
					</ClipboardButton>
				</div>
				{ ! isScheduled && (
					<div className="editor-post-publish-modal__content-publish-controls">
						<Button
							href={ post.link }
							isPrimary
							isLarge
						>
							{ viewPostLabel }
						</Button>
					</div>
				) }
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
