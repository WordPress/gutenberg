/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';

export type ImageLoadingStatus = 'idle' | 'loading' | 'loaded' | 'error';

/**
 * Probes an image URL via a side-channel `new Image()` preloader and returns
 * the current loading status. The DOM `<img>` should only mount when the
 * status is `'loaded'`, preventing broken-image icons from ever appearing.
 *
 * @param src - The image URL to probe. When falsy, status is `'idle'`.
 */
export function useImageLoadingStatus( src?: string ): ImageLoadingStatus {
	const [ status, setStatus ] = useState< ImageLoadingStatus >( () =>
		getInitialStatus( src )
	);

	useEffect( () => {
		if ( ! src ) {
			setStatus( 'idle' );
			return;
		}

		// Check if the image is already cached by the browser.
		const image = new window.Image();
		image.src = src;

		if ( image.complete && image.naturalWidth > 0 ) {
			setStatus( 'loaded' );
			return;
		}

		setStatus( 'loading' );

		let isMounted = true;

		image.onload = () => {
			if ( isMounted ) {
				setStatus( 'loaded' );
			}
		};

		image.onerror = () => {
			if ( isMounted ) {
				setStatus( 'error' );
			}
		};

		return () => {
			isMounted = false;
		};
	}, [ src ] );

	return status;
}

/**
 * Returns the initial status synchronously — avoids a flash of initials for
 * images that are already in the browser cache.
 *
 * @param src - The image URL to check.
 */
function getInitialStatus( src?: string ): ImageLoadingStatus {
	if ( ! src ) {
		return 'idle';
	}

	if ( typeof window === 'undefined' ) {
		return 'loading';
	}

	const image = new window.Image();
	image.src = src;

	if ( image.complete && image.naturalWidth > 0 ) {
		return 'loaded';
	}

	return 'loading';
}
