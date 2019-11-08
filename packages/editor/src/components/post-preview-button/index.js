/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { Button, Modal } from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import { withSelect, withDispatch } from '@wordpress/data';
import { ifCondition, compose } from '@wordpress/compose';

export class PostPreviewButton extends Component {
	constructor() {
		super( ...arguments );

		this.state = {
			isPreviewOpen: false,
			previewSize: {
				width: '1200px',
				height: '800px',
			},
		};
		this.openPreviewWindow = this.openPreviewWindow.bind( this );
		this.closePreviewWindow = this.closePreviewWindow.bind( this );
		this.setDesktopPreview = this.setDesktopPreview.bind( this );
		this.setTabletPreview = this.setTabletPreview.bind( this );
		this.setMobilePreview = this.setMobilePreview.bind( this );
	}

	componentDidUpdate( prevProps ) {
		const { previewLink } = this.props;

		// This relies on the window being responsible to unset itself when
		// navigation occurs or a new preview window is opened, to avoid
		// unintentional forceful redirects.
		if ( previewLink && ! prevProps.previewLink ) {
			this.setPreviewWindowLink( previewLink );
		}
	}

	/**
	 * Sets the preview window's location to the given URL, if a preview window
	 * exists and is not closed.
	 *
	 * @param {string} url URL to assign as preview window location.
	 */
	setPreviewWindowLink( url ) {
		const { previewWindow } = this;

		if ( previewWindow && ! previewWindow.closed ) {
			previewWindow.location = url;
		}
	}

	getWindowTarget() {
		const { postId } = this.props;
		return `wp-preview-${ postId }`;
	}

	openPreviewWindow( ) {
		this.setState( { isPreviewOpen: true } );
	}

	setDesktopPreview() {
		this.setState( {
			previewSize: {
				width: '1200px',
				height: '800px',
			},
		} );
	}

	setTabletPreview() {
		this.setState( {
			previewSize: {
				width: '768px',
				height: '1024px',
			},
		} );
	}

	setMobilePreview() {
		this.setState( {
			previewSize: {
				width: '375px',
				height: '812px',
			},
		} );
	}

	closePreviewWindow() {
		this.setState( { isPreviewOpen: false } );
	}

	render() {
		const { previewLink, isSaveable } = this.props;

		// Link to the `?preview=true` URL if we have it, since this lets us see
		// changes that were autosaved since the post was last published. Otherwise,
		// just link to the post's URL.

		return (
			<>
				<Button
					isLarge
					className="editor-post-preview"
					disabled={ ! isSaveable }
					onClick={ this.openPreviewWindow }
				>
					{ _x( 'Preview', 'imperative verb' ) }

					<DotTip tipId="core/editor.preview">
						{ __( 'Click “Preview” to load a preview of this page, so you can make sure you’re happy with your blocks.' ) }
					</DotTip>
				</Button>
				{ this.state.isPreviewOpen &&
				<Modal
					title={
					// translators: Preview dialog title.
						__( 'Preview' )
					}
					onRequestClose={ this.closePreviewWindow }
					className="editor-block-preview"
				>
					<div className="editor-block-preview__controls">
						<button onClick={ this.setDesktopPreview }>Desktop</button>
						<button onClick={ this.setTabletPreview }>Tablet</button>
						<button onClick={ this.setMobilePreview }>Mobile</button>
					</div>
					<div className="editor-block-preview__frame">
						<iframe
							title="tehPreview"
							src={ previewLink }
							style={
								{
									width: this.state.previewSize.width,
									height: this.state.previewSize.height,
								}
							}
						></iframe>
					</div>
				</Modal>
				}
			</>
		);
	}
}

export default compose( [
	withSelect( ( select, { forcePreviewLink, forceIsAutosaveable } ) => {
		const {
			getCurrentPostId,
			getCurrentPostAttribute,
			getEditedPostAttribute,
			isEditedPostSaveable,
			isEditedPostAutosaveable,
			getEditedPostPreviewLink,
		} = select( 'core/editor' );
		const {
			getPostType,
		} = select( 'core' );

		const previewLink = getEditedPostPreviewLink();
		const postType = getPostType( getEditedPostAttribute( 'type' ) );

		return {
			postId: getCurrentPostId(),
			currentPostLink: getCurrentPostAttribute( 'link' ),
			previewLink: forcePreviewLink !== undefined ? forcePreviewLink : previewLink,
			isSaveable: isEditedPostSaveable(),
			isAutosaveable: forceIsAutosaveable || isEditedPostAutosaveable(),
			isViewable: get( postType, [ 'viewable' ], false ),
			isDraft: [ 'draft', 'auto-draft' ].indexOf( getEditedPostAttribute( 'status' ) ) !== -1,
		};
	} ),
	withDispatch( ( dispatch ) => ( {
		autosave: dispatch( 'core/editor' ).autosave,
		savePost: dispatch( 'core/editor' ).savePost,
	} ) ),
	ifCondition( ( { isViewable } ) => isViewable ),
] )( PostPreviewButton );
