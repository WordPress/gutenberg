/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	PanelBody,
	Button,
	ClipboardButton,
	TextControl,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { Component, createRef } from '@wordpress/element';
import { withSelect } from '@wordpress/data';
import { safeDecodeURIComponent } from '@wordpress/url';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import PostScheduleLabel from '../post-schedule/label';

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
					<a ref={ this.postLink } href={ post.link }>
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
						value={ safeDecodeURIComponent( post.link ) }
						onFocus={ this.onSelectInput }
					/>
					<div className="post-publish-panel__postpublish-buttons">
						{ ! isScheduled && (
							<Button isSecondary href={ post.link }>
								{ viewPostLabel }
							</Button>
						) }

						<ClipboardButton
							isSecondary
							text={ post.link }
							onCopy={ this.onCopy }
						>
							{ this.state.showCopyConfirmation
								? __( 'Copied!' )
								: __( 'Copy Link' ) }
						</ClipboardButton>
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
