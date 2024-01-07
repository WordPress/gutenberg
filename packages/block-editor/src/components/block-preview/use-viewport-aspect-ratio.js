/**
 * WordPress dependencies
 */
import { useSyncExternalStore } from '@wordpress/element';

class ViewportAspectRatioStore {
	constructor() {
		this.aspectRatio = window.innerWidth / window.innerHeight;
	}

	getSnapshot = () => {
		return this.aspectRatio;
	};

	subscribe = () => {
		function onResize() {
			this.aspectRatio = window.innerWidth / window.innerHeight;
		}
		window.addEventListener( 'resize', onResize );
		return () => {
			window.removeEventListener( 'resize', onResize );
		};
	};
}

const viewportAspectRatioStore = new ViewportAspectRatioStore();

export default function useViewportAspectRatio() {
	return useSyncExternalStore(
		viewportAspectRatioStore.subscribe,
		viewportAspectRatioStore.getSnapshot
	);
}
