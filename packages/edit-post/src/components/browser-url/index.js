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
 * Quiet period that collapses rapid URL changes (slider drags, held
 * arrow keys) into one trailing write; a change after a quiet period
 * writes immediately. Safari throws when the History API is called
 * more than 100 times per 30 seconds.
 */
const URL_WRITE_DEBOUNCE_MS = 300;

/**
 * Returns the Post's Edit URL.
 *
 * @param {number}  postId     Post ID.
 * @param {?number} revisionId Optional revision ID being previewed.
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
	// Captured during the first render, before the URL sync below
	// rewrites the address bar.
	const [ initialRevisionId ] = useState( () => {
		const revision = Number(
			getQueryArg( window.location.href, 'revision' )
		);
		return Number.isInteger( revision ) && revision > 0 ? revision : null;
	} );
	const hasHandledInitialRevisionRef = useRef( false );

	const { postId, postStatus, currentRevisionId, disableVisualRevisions } =
		useSelect( ( select ) => {
			const { getCurrentPost, getEditorSettings } = select( editorStore );
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
				// A revision belongs to the edited post; never attach it
				// to a template opened from within the post editor.
				currentRevisionId: isTemplate ? null : getCurrentRevisionId(),
				disableVisualRevisions:
					!! getEditorSettings().disableVisualRevisions,
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
		if ( disableVisualRevisions ) {
			window.location.href = addQueryArgs( 'revision.php', {
				revision: initialRevisionId,
			} );
			return;
		}
		openRevision( initialRevisionId );
	}, [ initialRevisionId, postId, disableVisualRevisions, openRevision ] );

	// Seeded on the first sync so the initial write always goes through
	// the trailing timeout, giving a deep-linked revision time to land
	// in the store before the URL is first rewritten.
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
				// The browser rate-limited the write; the next change
				// will retry.
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
