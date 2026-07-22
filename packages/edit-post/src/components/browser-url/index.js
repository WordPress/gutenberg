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
import useClassicRevisionRedirect from './use-classic-revision-redirect';

/**
 * Safari throws when rapid revision changes trigger more than 100 History API
 * calls in 30 seconds.
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
	useClassicRevisionRedirect();

	// Read the initial revision once, before URL sync can overwrite it.
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
			// `post.php` rejects templates because `show_ui` is false. Adding
			// their revision ID to this URL would create a dead link.
			currentRevisionId: isTemplate ? null : getCurrentRevisionId(),
		};
	}, [] );
	const { openRevision } = unlock( useDispatch( editorStore ) );

	const lastURLWriteTimeRef = useRef( null );
	const lastPostIdRef = useRef( null );

	useEffect( () => {
		if ( ! postId ) {
			return;
		}
		if ( initialRevisionId && ! hasHandledInitialRevisionRef.current ) {
			hasHandledInitialRevisionRef.current = true;
			openRevision( initialRevisionId );
			return;
		}
		if ( postStatus === 'auto-draft' ) {
			return;
		}
		const previousPostId = lastPostIdRef.current;
		lastPostIdRef.current = postId;
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
				// Leave the URL unchanged. The effect can try again on the next
				// state change.
			}
		};
		if ( previousPostId !== null && previousPostId !== postId ) {
			write();
			return;
		}
		if ( lastURLWriteTimeRef.current === null ) {
			write();
			return;
		}
		if (
			Date.now() - lastURLWriteTimeRef.current >=
			URL_WRITE_DEBOUNCE_MS
		) {
			write();
			return;
		}
		const timeoutId = setTimeout( write, URL_WRITE_DEBOUNCE_MS );
		return () => clearTimeout( timeoutId );
	}, [
		postId,
		postStatus,
		currentRevisionId,
		initialRevisionId,
		openRevision,
	] );

	return null;
}
