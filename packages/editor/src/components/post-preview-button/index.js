/**
 * WordPress dependencies
 */
import { renderToString } from '@wordpress/element';
import { Button, Path, SVG, VisuallyHidden } from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { applyFilters } from '@wordpress/hooks';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

function writeInterstitialMessage( targetDocument ) {
	let markup = renderToString(
		<div className="editor-post-preview-button__interstitial-message">
			<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
				<Path
					className="outer"
					d="M48 12c19.9 0 36 16.1 36 36S67.9 84 48 84 12 67.9 12 48s16.1-36 36-36"
					fill="none"
				/>
				<Path
					className="inner"
					d="M69.5 46.4c0-3.9-1.4-6.7-2.6-8.8-1.6-2.6-3.1-4.9-3.1-7.5 0-2.9 2.2-5.7 5.4-5.7h.4C63.9 19.2 56.4 16 48 16c-11.2 0-21 5.7-26.7 14.4h2.1c3.3 0 8.5-.4 8.5-.4 1.7-.1 1.9 2.4.2 2.6 0 0-1.7.2-3.7.3L40 67.5l7-20.9L42 33c-1.7-.1-3.3-.3-3.3-.3-1.7-.1-1.5-2.7.2-2.6 0 0 5.3.4 8.4.4 3.3 0 8.5-.4 8.5-.4 1.7-.1 1.9 2.4.2 2.6 0 0-1.7.2-3.7.3l11.5 34.3 3.3-10.4c1.6-4.5 2.4-7.8 2.4-10.5zM16.1 48c0 12.6 7.3 23.5 18 28.7L18.8 35c-1.7 4-2.7 8.4-2.7 13zm32.5 2.8L39 78.6c2.9.8 5.9 1.3 9 1.3 3.7 0 7.3-.6 10.6-1.8-.1-.1-.2-.3-.2-.4l-9.8-26.9zM76.2 36c0 3.2-.6 6.9-2.4 11.4L64 75.6c9.5-5.5 15.9-15.8 15.9-27.6 0-5.5-1.4-10.8-3.9-15.3.1 1 .2 2.1.2 3.3z"
					fill="none"
				/>
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
		</style>
	`;

	/**
	 * Filters the interstitial message shown when generating previews.
	 *
	 * @param {string} markup The preview interstitial markup.
	 */
	markup = applyFilters( 'editor.PostPreview.interstitialMarkup', markup );

	targetDocument.write( markup );
	targetDocument.title = __( 'Generating preview…' );
	targetDocument.close();
}

/**
 * Renders a button that opens a new window or tab for the preview,
 * writes the interstitial message to this window, and then navigates
 * to the actual preview link. The button is not rendered if the post
 * is not viewable and disabled if the post is not saveable.
 *
 * @param {Object}   props                     The component props.
 * @param {string}   props.className           The class name for the button.
 * @param {string}   props.textContent         The text content for the button.
 * @param {boolean}  props.forceIsAutosaveable Whether to force autosave.
 * @param {string}   props.role                The role attribute for the button.
 * @param {Function} props.onPreview           The callback function for preview event.
 *
 * @return {JSX.Element|null} The rendered button component.
 */
export default function PostPreviewButton( {
	className,
	textContent,
	forceIsAutosaveable,
	role,
	onPreview,
} ) {
	const { postId, currentPostLink, previewLink, isSaveable, isViewable } =
		useSelect( ( select ) => {
			const editor = select( editorStore );
			const core = select( coreStore );

			const postType = core.getPostType(
				editor.getCurrentPostType( 'type' )
			);

			return {
				postId: editor.getCurrentPostId(),
				currentPostLink: editor.getCurrentPostAttribute( 'link' ),
				previewLink: editor.getEditedPostPreviewLink(),
				isSaveable: editor.isEditedPostSaveable(),
				isViewable: postType?.viewable ?? false,
			};
		}, [] );

	const { __unstableSaveForPreview } = useDispatch( editorStore );

	if ( ! isViewable ) {
		return null;
	}

	const targetId = `wp-preview-${ postId }`;

	const openPreviewWindow = async ( event ) => {
		// Our Preview button has its 'href' and 'target' set correctly for a11y
		// purposes. Unfortunately, though, we can't rely on the default 'click'
		// handler since sometimes it incorrectly opens a new tab instead of reusing
		// the existing one.
		// https://github.com/WordPress/gutenberg/pull/8330
		event.preventDefault();

		// Open up a Preview tab if needed. This is where we'll show the preview.
		const previewWindow = window.open( '', targetId );

		// Focus the Preview tab. This might not do anything, depending on the browser's
		// and user's preferences.
		// https://html.spec.whatwg.org/multipage/interaction.html#dom-window-focus
		previewWindow.focus();

		writeInterstitialMessage( previewWindow.document );

		const link = await __unstableSaveForPreview( { forceIsAutosaveable } );

		previewWindow.location = link;

		onPreview?.();
	};

	// Link to the `?preview=true` URL if we have it, since this lets us see
	// changes that were autosaved since the post was last published. Otherwise,
	// just link to the post's URL.
	const href = previewLink || currentPostLink;

	return (
		<Button
			variant={ ! className ? 'tertiary' : undefined }
			className={ className || 'editor-post-preview' }
			href={ href }
			target={ targetId }
			accessibleWhenDisabled
			disabled={ ! isSaveable }
			onClick={ openPreviewWindow }
			role={ role }
			size="compact"
		>
			{ textContent || (
				<>
					{ _x( 'Preview', 'imperative verb' ) }
					<VisuallyHidden as="span">
						{
							/* translators: accessibility text */
							__( '(opens in a new tab)' )
						}
					</VisuallyHidden>
				</>
			) }
		</Button>
	);
}
