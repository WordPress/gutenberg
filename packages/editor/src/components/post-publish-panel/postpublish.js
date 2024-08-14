/**
 * WordPress dependencies
 */
import { PanelBody, Button, TextControl } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { Component, createRef } from '@wordpress/element';
import { withSelect } from '@wordpress/data';
import { addQueryArgs, safeDecodeURIComponent } from '@wordpress/url';
import { decodeEntities } from '@wordpress/html-entities';
import { useCopyToClipboard } from '@wordpress/compose';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import PostScheduleLabel from '../post-schedule/label';
import { store as editorStore } from '../../store';

const POSTNAME = '%postname%';
const PAGENAME = '%pagename%';

/**
 * Returns URL for a future post.
 *
 * @param {Object} post Post object.
 *
 * @return {string} PostPublish URL.
 */

const getFuturePostUrl = ( post ) => {
	const { slug } = post;

	if ( post.permalink_template.includes( POSTNAME ) ) {
		return post.permalink_template.replace( POSTNAME, slug );
	}

	if ( post.permalink_template.includes( PAGENAME ) ) {
		return post.permalink_template.replace( PAGENAME, slug );
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
		const postLabel = postType?.labels?.singular_name;
		const viewPostLabel = postType?.labels?.view_item;
		const addNewPostLabel = postType?.labels?.add_new_item;
		const link =
			post.status === 'future' ? getFuturePostUrl( post ) : post.link;
		const addLink = addQueryArgs( 'post-new.php', {
			post_type: post.type,
		} );

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
					<div className="post-publish-panel__postpublish-post-address-container">
						<TextControl
							// TODO: Switch to `true` (40px size) if possible
							__next40pxDefaultSize={ false }
							__nextHasNoMarginBottom
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

						<div className="post-publish-panel__postpublish-post-address__copy-button-wrap">
							<CopyButton text={ link } onCopy={ this.onCopy }>
								{ this.state.showCopyConfirmation
									? __( 'Copied!' )
									: __( 'Copy' ) }
							</CopyButton>
						</div>
					</div>

					<div className="post-publish-panel__postpublish-buttons">
						{ ! isScheduled && (
							<Button variant="primary" href={ link }>
								{ viewPostLabel }
							</Button>
						) }
						<Button
							variant={ isScheduled ? 'primary' : 'secondary' }
							href={ addLink }
						>
							{ addNewPostLabel }
						</Button>
					</div>
				</PanelBody>
				{ children }
			</div>
		);
	}
}

export default withSelect( ( select ) => {
	const { getEditedPostAttribute, getCurrentPost, isCurrentPostScheduled } =
		select( editorStore );
	const { getPostType } = select( coreStore );

	return {
		post: getCurrentPost(),
		postType: getPostType( getEditedPostAttribute( 'type' ) ),
		isScheduled: isCurrentPostScheduled(),
	};
} )( PostPublishPanelPostpublish );
