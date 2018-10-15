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

		const markup = `
			<div class="post">
  				<h1 class="editor-post-title__input"></h1>
  				<img class="cover-image"/>
  				<p></p>
  				<p></p>
  				<h1></h1>
  				<p></p>
  				<img/>
  				<ul>
    				<li></li>
    				<li></li>
    				<li></li>
  				</ul>
  				<h1></h1>
  				<p></p>
			</div>
			<style>
			/*
 			 * Variables
			 */
			:root {
  				--line-height: 24px;
  				--line-spacing: 6px;
  				--element-spacing: 42px;
  				--dark-grey: #999;
  				--light-grey: #ccc;
			}

			body {
				min-height: 100vh;
  				background-color: #FFF;
  				display: flex;
  				justify-content: center;
  				align-items: center;
			}

			.post {
  				margin-top: var(--element-spacing);
  				width: 500px;
  				max-width: 100%;
  				-webkit-animation: loading 1.5s infinite;
          				animation: loading 1.5s infinite;
  				position: relative;
			}
			.post h1 {
  				background: var(--light-grey);
  				width: 100%;
  				height: calc(var(--line-height)*1.75);
  				margin-bottom: var(--element-spacing);
  				margin-top: calc(var(--element-spacing)*1.5);
			}
			.post p {
  				height: calc(var(--line-height)*3 + var(--line-spacing)*2);
  				width: 100%;
  				background: linear-gradient(180deg, var(--light-grey) 0, var(--light-grey) var(--line-height), #fff var(--line-height), #fff calc(var(--line-height) + var(--line-spacing)), var(--light-grey) calc(var(--line-height) + var(--line-spacing)), var(--light-grey) calc(var(--line-height)*2 + var(--line-spacing)), #fff calc(var(--line-height)*2 + var(--line-spacing)), #fff calc(var(--line-height)*2 + var(--line-spacing)*2), var(--light-grey) calc(var(--line-height)*2 + var(--line-spacing)*2), var(--light-grey) calc(var(--line-height)*2 + var(--line-spacing)*3));
  				margin-bottom: var(--element-spacing);
			}
			.post img {
  				display: block;
  				background: var(--light-grey);
  				width: 100%;
  				height: 200px;
  				margin-bottom: var(--element-spacing);
			}
			.post .cover-image {
  				width: 120%;
  				margin-left: -10%;
  				margin-right: -10%;
  				background-image: linear-gradient(white 0, white var(--line-height), transparent calc(40% + var(--line-height)), transparent 100%);
  				background-size: 50% var(--line-height);
  				background-position: center center;
  				background-repeat: no-repeat;
			}
			.post ul {
  				margin-bottom: var(--element-spacing);
			}
			.post li {
  				background: var(--light-grey);
  				width: 100%;
  				height: 24px;
  				margin-bottom: 10px;
  				position: relative;
			}
			.post li::before {
  				display: block;
  				content: '';
  				border-radius: 50%;
  				background: var(--light-grey);
  				height: 16px;
  				width: 16px;
  				position: absolute;
  				left: -24px;
  				top: 4px;
			}
			.post::after {
  				display: block;
  				content: '';
  				position: absolute;
 				top: 0;
  				right: 0;
  				left: 0;
  				bottom: 0;
  				background-image: linear-gradient(92deg, rgba(255, 255, 255, 0.2) 0, rgba(255, 255, 255, 0.7) 50%, rgba(255, 255, 255, 0.2) 100%);
  				background-position: 0 0;
  				background-size: 200% 100%;
  				background-repeat: repeat-x;
  				-webkit-animation: loading 1200ms linear infinite;
          				animation: loading 1200ms linear infinite;
  				width: 120%;
  				margin-left: -10%;
  				margin-right: -10%;
			}

			@-webkit-keyframes loading {
  				from {
    				background-position: 0 0;
  				}
  				to {
    				background-position: -200% 0;
  				}
			}

			@keyframes loading {
  				from {
    				background-position: 0 0;
  				}
  				to {
    				background-position: -200% 0;
  				}
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
