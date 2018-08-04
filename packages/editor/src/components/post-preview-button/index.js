/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { Button } from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import { withSelect, withDispatch } from '@wordpress/data';
import { DotTip } from '@wordpress/nux';
import { ifCondition, compose } from '@wordpress/compose';

export class PostPreviewButton extends Component {
	constructor() {
		super( ...arguments );

		this.openPreviewWindow = this.openPreviewWindow.bind( this );
	}

	componentDidUpdate( prevProps ) {
		const { previewLink } = this.props;

		// This relies on the window being responsible to unset itself when
		// navigation occurs or a new preview window is opened, to avoid
		// unintentional forceful redirects.
		if ( previewLink && ! prevProps.previewLink ) {
			this.setPreviewWindowLink( previewLink );

			// Once popup redirect is evaluated, even if already closed, delete
			// reference to avoid later assignment of location in post update.
			delete this.previewWindow;
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

	/**
	 * Opens a popup window, navigating user to a preview of the current post.
	 * Triggers autosave if post is autosaveable.
	 */
	openPreviewWindow() {
		const { isAutosaveable, previewLink, currentPostLink } = this.props;

		// Open a popup, BUT: Set it to a blank page until save completes. This
		// is necessary because popups can only be opened in response to user
		// interaction (click), but we must still wait for the post to save.
		if ( ! this.previewWindow ) {
			this.previewWindow = window.open( '', this.getWindowTarget() );
		}

		// If there are no changes to autosave, we cannot perform the save, but
		// if there is an existing preview link (e.g. previous published post
		// autosave), it should be reused as the popup destination.
		if ( ! isAutosaveable && ! previewLink && currentPostLink ) {
			this.setPreviewWindowLink( currentPostLink );
			return;
		}

		if ( ! isAutosaveable ) {
			this.setPreviewWindowLink( previewLink );
			return;
		}

		this.props.autosave();

		const markup = `
			<div class="editor-post-preview-button__interstitial-message">
				<p>Please wait&hellip;</p>
				<p>Generating preview.</p>
			</div>
			<style>
				body {
					margin: 0;
				}
				.editor-post-preview-button__interstitial-message {
					display: flex;
					flex-direction: column;
					align-items: center;
					justify-content: center;
					height: 100vh;
					width: 100vw;
				}
				p {
					text-align: center;
					font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
				}
			</style>`;

		this.previewWindow.document.write( markup );
		this.previewWindow.document.close();
	}

	render() {
		const { isSaveable } = this.props;

		return (
			<Button
				className="editor-post-preview"
				isLarge
				onClick={ this.openPreviewWindow }
				disabled={ ! isSaveable }
			>
				{ _x( 'Preview', 'imperative verb' ) }
				<DotTip id="core/editor.preview">
					{ __( 'Click ‘Preview’ to load a preview of this page, so you can make sure you’re happy with your blocks.' ) }
				</DotTip>
			</Button>
		);
	}
}

export default compose( [
	withSelect( ( select ) => {
		const {
			getCurrentPostId,
			getCurrentPostAttribute,
			getAutosaveAttribute,
			getEditedPostAttribute,
			isEditedPostDirty,
			isEditedPostNew,
			isEditedPostSaveable,
			isEditedPostAutosaveable,
		} = select( 'core/editor' );
		const {
			getPostType,
		} = select( 'core' );
		const postType = getPostType( getEditedPostAttribute( 'type' ) );
		return {
			postId: getCurrentPostId(),
			currentPostLink: getCurrentPostAttribute( 'link' ),
			previewLink: getAutosaveAttribute( 'preview_link' ),
			isDirty: isEditedPostDirty(),
			isNew: isEditedPostNew(),
			isSaveable: isEditedPostSaveable(),
			isAutosaveable: isEditedPostAutosaveable(),
			isViewable: get( postType, [ 'viewable' ], false ),
		};
	} ),
	withDispatch( ( dispatch ) => ( {
		autosave: dispatch( 'core/editor' ).autosave,
	} ) ),
	ifCondition( ( { isViewable } ) => isViewable ),
] )( PostPreviewButton );
