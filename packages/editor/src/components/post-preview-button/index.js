/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component, renderToString } from '@wordpress/element';
import { Button, Path, SVG } from '@wordpress/components';
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
		if ( ! this.previewWindow || this.previewWindow.closed ) {
			this.previewWindow = window.open( '', this.getWindowTarget() );
		}

		// Ask the browser to bring the preview tab to the front
		// This can work or not depending on the browser's user preferences
		// https://html.spec.whatwg.org/multipage/interaction.html#dom-window-focus
		this.previewWindow.focus();

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

		let markup = renderToString(
			<div className="editor-post-preview-button__interstitial-message">
				<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
					<Path className="outer" d="M48 12c19.9 0 36 16.1 36 36S67.9 84 48 84 12 67.9 12 48s16.1-36 36-36" fill="none" />
					<Path className="inner" d="M69.5 46.4c0-3.9-1.4-6.7-2.6-8.8-1.6-2.6-3.1-4.9-3.1-7.5 0-2.9 2.2-5.7 5.4-5.7h.4C63.9 19.2 56.4 16 48 16c-11.2 0-21 5.7-26.7 14.4h2.1c3.3 0 8.5-.4 8.5-.4 1.7-.1 1.9 2.4.2 2.6 0 0-1.7.2-3.7.3L40 67.5l7-20.9L42 33c-1.7-.1-3.3-.3-3.3-.3-1.7-.1-1.5-2.7.2-2.6 0 0 5.3.4 8.4.4 3.3 0 8.5-.4 8.5-.4 1.7-.1 1.9 2.4.2 2.6 0 0-1.7.2-3.7.3l11.5 34.3 3.3-10.4c1.6-4.5 2.4-7.8 2.4-10.5zM16.1 48c0 12.6 7.3 23.5 18 28.7L18.8 35c-1.7 4-2.7 8.4-2.7 13zm32.5 2.8L39 78.6c2.9.8 5.9 1.3 9 1.3 3.7 0 7.3-.6 10.6-1.8-.1-.1-.2-.3-.2-.4l-9.8-26.9zM76.2 36c0 3.2-.6 6.9-2.4 11.4L64 75.6c9.5-5.5 15.9-15.8 15.9-27.6 0-5.5-1.4-10.8-3.9-15.3.1 1 .2 2.1.2 3.3z" fill="none" />
				</SVG>
				<p>{ __( 'Generating preview…' ) }</p>
			</div>
		);

		markup += `
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
				@-webkit-keyframes paint {
					0% {
						stroke-dashoffset: 0;
					}
				}
				@-moz-keyframes paint {
					0% {
						stroke-dashoffset: 0;
					}
				}
				@-o-keyframes paint {
					0% {
						stroke-dashoffset: 0;
					}
				}
				@keyframes paint {
					0% {
						stroke-dashoffset: 0;
					}
				}
				.editor-post-preview-button__interstitial-message svg {
					width: 192px;
					height: 192px;
					stroke: #555d66;
					stroke-width: 0.75;
				}
				.editor-post-preview-button__interstitial-message svg .outer,
				.editor-post-preview-button__interstitial-message svg .inner {
					stroke-dasharray: 280;
					stroke-dashoffset: 280;
					-webkit-animation: paint 1.5s ease infinite alternate;
					-moz-animation: paint 1.5s ease infinite alternate;
					-o-animation: paint 1.5s ease infinite alternate;
					animation: paint 1.5s ease infinite alternate;
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
					{ __( 'Click “Preview” to load a preview of this page, so you can make sure you’re happy with your blocks.' ) }
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
