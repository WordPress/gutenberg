/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';

/**
 * Delay showing a loader to avoid visual flicker for fast loads.
 *
 * Returns `true` only after `isLoading` has been `true` for at least
 * `options.delay` milliseconds. Resets to `false` when loading ends.
 *
 * @param isLoading     Whether a loading operation is in progress.
 * @param options       Options object.
 * @param options.delay Time in milliseconds to wait before showing the loader. Default `400`.
 *
 * @return Whether the loader should be shown.
 */
export default function useDelayedLoading(
	isLoading: boolean,
	options: { delay: number } = { delay: 400 }
): boolean {
	const [ showLoader, setShowLoader ] = useState( false );
	useEffect( () => {
		if ( ! isLoading ) {
			return;
		}
		const timeout = setTimeout( () => {
			setShowLoader( true );
		}, options.delay );
		return () => {
			clearTimeout( timeout );
			setShowLoader( false );
		};
	}, [ isLoading, options.delay ] );
	return showLoader;
}
