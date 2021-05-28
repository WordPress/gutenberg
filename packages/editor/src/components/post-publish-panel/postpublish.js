/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { PanelBody, Button, TextControl } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { Component, createRef } from '@wordpress/element';
import { withSelect } from '@wordpress/data';
import { safeDecodeURIComponent } from '@wordpress/url';
import { decodeEntities } from '@wordpress/html-entities';
import { useCopyToClipboard } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import PostScheduleLabel from '../post-schedule/label';

const POSTNAME = '%postname%';

/**
 * Returns URL for a future post.
 *
 * @param {Object} post         Post object.
 *
 * @return {string} PostPublish URL.
 */

const getFuturePostUrl = ( post ) => {
	const { slug } = post;

	if ( post.permalink_template.includes( POSTNAME ) ) {
		return post.permalink_template.replace( POSTNAME, slug );
	}

	return post.permalink_template;
};

function CopyButton( { text, onCopy, children } ) {
	const ref = useCopyToClipboard( text, onCopy );
	return (
		<Button variant="secondary" ref={ ref }>
			{ children }
		</Button>
	);
}

class PostPublishPanelPostpublish extends Component {
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
		const link =
			post.status === 'future' ? getFuturePostUrl( post ) : post.link;

		const postPublishNonLinkHeader = isScheduled ? (
			<>
				{ __( 'is now scheduled. It will go live on' ) }{ ' ' }
				<PostScheduleLabel />.
			</>
		) : (
			__( 'is now live.' )
		);

		return (
			<div className="post-publish-panel__postpublish">
				<PanelBody className="post-publish-panel__postpublish-header">
					<a ref={ this.postLink } href={ link }>
						{ decodeEntities( post.title ) || __( '(no title)' ) }
					</a>{ ' ' }
					{ postPublishNonLinkHeader }
				</PanelBody>
				<PanelBody>
					<p className="post-publish-panel__postpublish-subheader">
						<strong>{ __( 'What’s next?' ) }</strong>
					</p>
					<TextControl
						className="post-publish-panel__postpublish-post-address"
						readOnly
						label={ sprintf(
							/* translators: %s: post type singular name */
							__( '%s address' ),
							postLabel
						) }
						value={ safeDecodeURIComponent( link ) }
						onFocus={ this.onSelectInput }
					/>
					<div className="post-publish-panel__postpublish-buttons">
						{ ! isScheduled && (
							<Button variant="secondary" href={ link }>
								{ viewPostLabel }
							</Button>
						) }
						<CopyButton text={ link } onCopy={ this.onCopy }>
							{ this.state.showCopyConfirmation
								? __( 'Copied!' )
								: __( 'Copy Link' ) }
						</CopyButton>
					</div>
				</PanelBody>
				{ children }
			</div>
		);
	}
}

export default withSelect( ( select ) => {
	const {
		getEditedPostAttribute,
		getCurrentPost,
		isCurrentPostScheduled,
	} = select( 'core/editor' );
	const { getPostType } = select( 'core' );

	return {
		post: getCurrentPost(),
		postType: getPostType( getEditedPostAttribute( 'type' ) ),
		isScheduled: isCurrentPostScheduled(),
	};
} )( PostPublishPanelPostpublish );
