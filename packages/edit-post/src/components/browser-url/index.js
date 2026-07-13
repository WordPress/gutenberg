/**
 * WordPress dependencies
 */
import { useEffect, useRef, useState } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { addQueryArgs, getQueryArg } from '@wordpress/url';
import { store as editorStore } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

/**
 * Wait this long before writing a burst of URL changes (slider drags,
 * held arrow keys) as one update. If a change arrives after a pause,
 * write it right away. Safari throws when the History API is called
 * more than 100 times per 30 seconds.
 */
const URL_WRITE_DEBOUNCE_MS = 300;

/**
 * Returns the Post's Edit URL.
 *
 * @param {number}  postId     Post ID.
 * @param {?number} revisionId Revision being previewed, if any.
 *
 * @return {string} Post edit URL.
 */
export function getPostEditURL( postId, revisionId ) {
	const args = { post: postId, action: 'edit' };
	if ( revisionId ) {
		args.revision = revisionId;
	}
	return addQueryArgs( 'post.php', args );
}

export default function BrowserURL() {
	// Read once during the first render, before the URL sync below
	// rewrites the address bar.
	const [ initialRevisionId ] = useState( () => {
		const revision = Number(
			getQueryArg( window.location.href, 'revision' )
		);
		return Number.isInteger( revision ) && revision > 0 ? revision : null;
	} );
	const hasHandledInitialRevisionRef = useRef( false );

	const { postId, postStatus, currentRevisionId } = useSelect( ( select ) => {
		const { getCurrentPost } = select( editorStore );
		const { getCurrentRevisionId } = unlock( select( editorStore ) );
		const post = getCurrentPost();
		let { id, status, type } = post;
		const isTemplate = [ 'wp_template', 'wp_template_part' ].includes(
			type
		);
		if ( isTemplate ) {
			id = post.wp_id;
		}

		return {
			postId: id,
			postStatus: status,
			// In template mode the URL points at the template, and
			// `post.php` refuses to open templates (their `show_ui` is
			// false), so a revision arg would make a dead link.
			currentRevisionId: isTemplate ? null : getCurrentRevisionId(),
		};
	}, [] );
	const { openRevision } = unlock( useDispatch( editorStore ) );

	useEffect( () => {
		if (
			! initialRevisionId ||
			hasHandledInitialRevisionRef.current ||
			! postId
		) {
			return;
		}
		hasHandledInitialRevisionRef.current = true;
		// Deep-linked revisions open in the visual editor. When classic
		// meta boxes are active, meta box initialization redirects to the
		// classic revision.php screen instead.
		openRevision( initialRevisionId );
	}, [ initialRevisionId, postId, openRevision ] );

	// Null until the first sync, so the first write always waits for the
	// trailing timeout. That gives a deep-linked revision time to land in
	// the store before the URL is rewritten.
	const lastURLWriteTimeRef = useRef( null );

	useEffect( () => {
		if ( ! postId || postStatus === 'auto-draft' ) {
			return;
		}
		if ( lastURLWriteTimeRef.current === null ) {
			lastURLWriteTimeRef.current = Date.now();
		}
		const url = getPostEditURL( postId, currentRevisionId );
		const write = () => {
			lastURLWriteTimeRef.current = Date.now();
			try {
				window.history.replaceState(
					{ id: postId },
					'Post ' + postId,
					url
				);
			} catch {
				// The browser rate-limited the write. The next change
				// will try again.
			}
		};
		if (
			Date.now() - lastURLWriteTimeRef.current >=
			URL_WRITE_DEBOUNCE_MS
		) {
			write();
			return;
		}
		const timeoutId = setTimeout( write, URL_WRITE_DEBOUNCE_MS );
		return () => clearTimeout( timeoutId );
	}, [ postId, postStatus, currentRevisionId ] );

	return null;
}
