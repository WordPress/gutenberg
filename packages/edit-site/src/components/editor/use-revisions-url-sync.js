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
 * Safari throws after more than 100 History API calls in 30 seconds.
 */
const URL_WRITE_DEBOUNCE_MS = 300;

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

	// On deep links, delay the first write so `openRevision()` can update
	// the store first.
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
			// Route matching can lag behind the address bar. Writing the stale
			// match back would undo the navigation.
			const addressBarArg =
				new URLSearchParams( window.location.search ).get(
					'revision'
				) ?? undefined;
			if ( addressBarArg !== location.query.revision ) {
				return;
			}
			lastURLWriteTimeRef.current = Date.now();
			// Passing `undefined` removes `revision` without dropping the other
			// query args.
			try {
				await history.navigate(
					addQueryArgs( location.path, { revision: revisionArg } ),
					{ replace: true }
				);
			} catch {
				// Leave the URL unchanged. The effect can try again on the next
				// state change.
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
