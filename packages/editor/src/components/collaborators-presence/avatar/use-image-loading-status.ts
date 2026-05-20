/**
 * WordPress dependencies
 */
import { useCallback, useState } from '@wordpress/element';

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
	const [ prevSrc, setPrevSrc ] = useState( src );
	const [ status, setStatus ] = useState< ImageLoadingStatus >(
		src ? 'loading' : 'idle'
	);

	// Synchronous reset when src changes — runs during render, not after
	// commit, so a cached image's `load` event cannot sneak in before
	// the reset and get overwritten.
	if ( prevSrc !== src ) {
		setPrevSrc( src );
		setStatus( src ? 'loading' : 'idle' );
	}

	const handleLoad = useCallback( () => setStatus( 'loaded' ), [] );
	const handleError = useCallback( () => setStatus( 'error' ), [] );

	return { status, handleLoad, handleError };
}
