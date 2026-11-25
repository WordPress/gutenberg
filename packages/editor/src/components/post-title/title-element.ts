import { useSyncExternalStore } from '@wordpress/element';

let titleElement: HTMLElement | null = null;
const listeners = new Set< () => void >();

function subscribe( listener: () => void ) {
	listeners.add( listener );
	return () => {
		listeners.delete( listener );
	};
}

function getSnapshot() {
	return titleElement;
}

/**
 * Records the post title element rendered in the canvas, so UI outside the
 * canvas (e.g. a floating note) can line up with it.
 *
 * @param element Title element, or `null` once it unmounts.
 */
export function setPostTitleElement( element: HTMLElement | null ) {
	if ( element === titleElement ) {
		return;
	}
	titleElement = element;
	for ( const listener of listeners ) {
		listener();
	}
}

/**
 * Returns the post title element rendered in the canvas, if any.
 *
 * @return Title element, or `null` when the canvas shows no title.
 */
export function usePostTitleElement(): HTMLElement | null {
	return useSyncExternalStore( subscribe, getSnapshot, getSnapshot );
}
