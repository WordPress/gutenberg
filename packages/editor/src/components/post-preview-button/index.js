/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { Button, IconButton, Modal, Path, SVG } from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import { withSelect, withDispatch } from '@wordpress/data';
import { ifCondition, compose } from '@wordpress/compose';

const DesktopIcon = <SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24"><Path d="M0 0h24v24H0z" fill="none" /><Path d="M21 2H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h7v2H8v2h8v-2h-2v-2h7c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H3V4h18v12z" /></SVG>;
const MobileIcon = <SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24"><Path d="M0 0h24v24H0z" fill="none" /><Path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z" /></SVG>;
const TabletIcon = <SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24"><Path d="M0 0h24v24H0z" fill="none" /><Path d="M21 4H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h18c1.1 0 1.99-.9 1.99-2L23 6c0-1.1-.9-2-2-2zm-2 14H5V6h14v12z" /></SVG>;

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
		this.openPreviewInNewTab = this.openPreviewInNewTab.bind( this );
		this.getWindowTarget = this.getWindowTarget.bind( this );
		this.setPreviewWindowLink = this.setPreviewWindowLink.bind( this );
		this.openPreviewModal = this.openPreviewModal.bind( this );
		this.closePreviewModal = this.closePreviewModal.bind( this );
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

	openPreviewModal() {
		this.setState( { isPreviewOpen: true } );

		// If we don't need to autosave the post before previewing, do nothing.
		if ( ! this.props.isAutosaveable ) {
			return;
		}

		// Request an autosave. This happens asynchronously and causes the component
		// to update when finished.
		if ( this.props.isDraft ) {
			this.props.savePost( { isPreview: true } );
		} else {
			this.props.autosave( { isPreview: true } );
		}
	}

	openPreviewInNewTab( event ) {
		// Our Preview button has its 'href' and 'target' set correctly for a11y
		// purposes. Unfortunately, though, we can't rely on the default 'click'
		// handler since sometimes it incorrectly opens a new tab instead of reusing
		// the existing one.
		// https://github.com/WordPress/gutenberg/pull/8330
		event.preventDefault();

		// Open up a Preview tab if needed. This is where we'll show the preview.
		if ( ! this.previewWindow || this.previewWindow.closed ) {
			this.previewWindow = window.open( '', '_blank' );
		}

		// Focus the Preview tab. This might not do anything, depending on the browser's
		// and user's preferences.
		// https://html.spec.whatwg.org/multipage/interaction.html#dom-window-focus
		this.previewWindow.focus();

		// Load the Preview URL in the Preview tab.
		this.setPreviewWindowLink( event.target.href );
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

	closePreviewModal() {
		this.setState( { isPreviewOpen: false } );
	}

	render() {
		const { previewLink, currentPostLink, isSaveable } = this.props;
		// Link to the `?preview=true` URL if we have it, since this lets us see
		// changes that were autosaved since the post was last published. Otherwise,
		// just link to the post's URL.
		const href = previewLink || currentPostLink;

		return (
			<>
				<Button
					isLarge
					className="editor-post-preview"
					disabled={ ! isSaveable }
					onClick={ this.openPreviewModal }
				>
					{ _x( 'Preview', 'imperative verb' ) }

					<span className="screen-reader-text">
						{
						/* translators: accessibility text */
							__( '(opens in a new tab)' )
						}
					</span>
				</Button>
				{ this.state.isPreviewOpen &&
					<Modal
						title={
							// translators: Preview dialog title.
							_x( 'Preview', 'noun' )
						}
						onRequestClose={ this.closePreviewModal }
						// Needed so the Modal doesn't close when tabbing into the iframe.
						shouldCloseOnClickOutside={ false }
						className="editor-post-preview-button__preview-modal"
					>
						<div className="editor-post-preview__controls">
							<IconButton
								icon={ DesktopIcon }
								onClick={ this.setDesktopPreview }
								label={ __( 'Preview desktop screen' ) }
							/>
							<IconButton
								icon={ TabletIcon }
								onClick={ this.setTabletPreview }
								label={ __( 'Preview tablet screen' ) }
							/>
							<IconButton
								icon={ MobileIcon }
								onClick={ this.setMobilePreview }
								label={ __( 'Preview phone screen' ) }
							/>
							<Button
								isLarge
								className="editor-post-preview__new-tab"
								href={ href }
								target={ this.getWindowTarget() }
								onClick={ this.openPreviewInNewTab }
							>
								{ __( 'Open preview in new tab' ) }
							</Button>
						</div>
						<div
							className="editor-post-preview__frame-container"
							tabIndex="0"
							role="region"
							aria-label={ _x( 'Preview', 'noun' ) }
						>
							<iframe
								className="editor-post-preview__frame"
								title={ __( 'Responsive preview' ) }
								src={ href }
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
