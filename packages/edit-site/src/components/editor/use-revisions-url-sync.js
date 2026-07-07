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
 * Quiet period that collapses rapid URL changes (slider drags, held
 * arrow keys) into one trailing write; a change after a quiet period
 * writes immediately. Safari throws when the History API is called
 * more than 100 times per 30 seconds.
 */
const URL_WRITE_DEBOUNCE_MS = 300;

/**
 * Keeps the `revision` query arg in sync with revisions mode: opens the
 * revision from the URL when the editor loads, and reflects the current
 * revision in the URL while previewing revisions, so the address bar is
 * always shareable.
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
		const revision = Number( location.query.revision );
		if ( ! Number.isInteger( revision ) || revision <= 0 ) {
			return;
		}
		hasOpenedInitialRevisionRef.current = true;
		openRevision( revision );
	}, [ enabled, postId, location.query.revision, openRevision ] );

	// Seeded on the first sync so the initial write always goes through
	// the trailing timeout, giving a deep-linked revision time to land
	// in the store before the URL is first rewritten.
	const lastURLWriteTimeRef = useRef( null );

	useEffect( () => {
		if ( ! enabled ) {
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
		const write = () => {
			lastURLWriteTimeRef.current = Date.now();
			// `location.path` carries the current query args; an undefined
			// value removes the arg.
			history.navigate(
				addQueryArgs( location.path, { revision: revisionArg } ),
				{ replace: true }
			);
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
	}, [ enabled, currentRevisionId, location, history ] );
}
