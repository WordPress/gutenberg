/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';
import { store as editorStore } from '@wordpress/editor';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { useHistory, useLocation } = unlock( routerPrivateApis );

/**
 * Wait this long before writing a burst of URL changes (slider drags,
 * held arrow keys) as one update. If a change arrives after a pause,
 * write it right away. Safari throws when the History API is called
 * more than 100 times per 30 seconds.
 */
const URL_WRITE_DEBOUNCE_MS = 300;

/**
 * Keep the `revision` query arg in sync with revisions mode. On load,
 * open the revision from the URL. After that, write the current revision
 * back to the URL so the address bar stays shareable.
 *
 * @param {boolean} enabled Whether the sync is active (edit mode only).
 */
export default function useRevisionsURLSync( enabled ) {
	const location = useLocation();
	const history = useHistory();
	const { postId, currentRevisionId } = useSelect( ( select ) => {
		return {
			postId: select( editorStore ).getCurrentPostId(),
			currentRevisionId: unlock(
				select( editorStore )
			).getCurrentRevisionId(),
		};
	}, [] );
	const { openRevision } = unlock( useDispatch( editorStore ) );

	const hasOpenedInitialRevisionRef = useRef( false );
	useEffect( () => {
		if ( ! enabled || hasOpenedInitialRevisionRef.current || ! postId ) {
			return;
		}
		hasOpenedInitialRevisionRef.current = true;
		const revision = Number( location.query.revision );
		if ( ! Number.isInteger( revision ) || revision <= 0 ) {
			return;
		}
		openRevision( revision );
	}, [ enabled, postId, location.query.revision, openRevision ] );

	// Null until the first sync, so the first write always waits for the
	// trailing timeout. That gives a deep-linked revision time to land in
	// the store before the URL is rewritten.
	const lastURLWriteTimeRef = useRef( null );

	useEffect( () => {
		if ( ! enabled || ! postId ) {
			return;
		}
		if ( lastURLWriteTimeRef.current === null ) {
			lastURLWriteTimeRef.current = Date.now();
		}
		const revisionArg = currentRevisionId
			? String( currentRevisionId )
			: undefined;
		if ( location.query.revision === revisionArg ) {
			return;
		}
		const write = async () => {
			lastURLWriteTimeRef.current = Date.now();
			// `location.path` already includes the current query args;
			// passing undefined removes the arg.
			try {
				await history.navigate(
					addQueryArgs( location.path, { revision: revisionArg } ),
					{ replace: true }
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
	}, [ enabled, postId, currentRevisionId, location, history ] );
}
