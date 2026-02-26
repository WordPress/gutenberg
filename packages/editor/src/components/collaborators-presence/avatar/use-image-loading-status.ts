/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useState } from '@wordpress/element';

export type ImageLoadingStatus = 'idle' | 'loading' | 'loaded' | 'error';

/**
 * Tracks the loading status of an image URL. Returns the current status and
 * `onLoad`/`onError` callbacks to attach to the `<img>` element.
 *
 * Unlike a side-channel `new Image()` preloader, this hook relies on the
 * native `<img>` element's own events, which avoids cross-browser issues
 * with Safari's privacy features blocking programmatic image requests.
 *
 * @param src - The image URL. When falsy, status is `'idle'`.
 */
export function useImageLoadingStatus( src?: string ) {
	const [ status, setStatus ] = useState< ImageLoadingStatus >(
		src ? 'loading' : 'idle'
	);

	// Reset when src changes.
	useEffect( () => {
		setStatus( src ? 'loading' : 'idle' );
	}, [ src ] );

	const handleLoad = useCallback( () => setStatus( 'loaded' ), [] );
	const handleError = useCallback( () => setStatus( 'error' ), [] );

	return { status, handleLoad, handleError };
}
