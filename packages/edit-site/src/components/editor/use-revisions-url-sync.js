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

export default function useRevisionsURLSync( enabled, postType, postId ) {
	const location = useLocation();
	const history = useHistory();
	const { currentPostType, currentPostId, currentRevisionId } = useSelect(
		( select ) => {
			const editor = select( editorStore );
			return {
				currentPostType: editor.getCurrentPostType(),
				currentPostId: editor.getCurrentPostId(),
				currentRevisionId: unlock( editor ).getCurrentRevisionId(),
			};
		},
		[]
	);
	const { openRevision, setCurrentRevisionId } = unlock(
		useDispatch( editorStore )
	);
	const entityKey = postType && postId ? `${ postType }:${ postId }` : null;
	const isCurrentEntity =
		!! entityKey &&
		currentPostType === postType &&
		String( currentPostId ) === String( postId );

	// The route can change before the editor store. Wait until both point to the
	// same entity so a revision from the previous entity is not copied into the
	// new URL.
	const handledEntityKeyRef = useRef( null );
	const lastURLWriteTimeRef = useRef( null );
	useEffect( () => {
		if ( ! enabled ) {
			handledEntityKeyRef.current = null;
			return;
		}
		if (
			! isCurrentEntity ||
			! entityKey ||
			handledEntityKeyRef.current === entityKey
		) {
			return;
		}

		lastURLWriteTimeRef.current = null;
		handledEntityKeyRef.current = entityKey;
		const revision = Number( location.query.revision );
		if ( Number.isInteger( revision ) && revision > 0 ) {
			openRevision( revision );
		} else if ( currentRevisionId ) {
			setCurrentRevisionId( null );
		}
	}, [
		enabled,
		isCurrentEntity,
		entityKey,
		location.query.revision,
		currentRevisionId,
		openRevision,
		setCurrentRevisionId,
	] );

	useEffect( () => {
		if (
			! enabled ||
			! isCurrentEntity ||
			! entityKey ||
			handledEntityKeyRef.current !== entityKey
		) {
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
	}, [
		enabled,
		isCurrentEntity,
		entityKey,
		currentRevisionId,
		location,
		history,
	] );
}
