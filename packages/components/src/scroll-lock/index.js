/**
 * WordPress dependencies
 */
import { useRef, useEffect } from '@wordpress/element';

/**
 * @param {string} className
 * @return {(locked: boolean) => void} Function allowing you to set whether scrolling is locked.
 */
function useSetLocked( className ) {
	/** @type {import('react').MutableRefObject<number | undefined>} */
	const previousScrollTop = useRef();

	/**
	 * @param {boolean} locked
	 */
	function setLocked( locked ) {
		if ( typeof document === undefined ) {
			// if in SSR context, don't do anything
			return;
		}

		const scrollingElement = document.scrollingElement || document.body;

		if ( locked ) {
			previousScrollTop.current = scrollingElement.scrollTop;
		}

		const methodName = locked ? 'add' : 'remove';
		scrollingElement.classList[ methodName ]( className );

		// Adding the class to the document element seems to be necessary in iOS.
		document.documentElement.classList[ methodName ]( className );

		if ( ! locked && previousScrollTop.current !== undefined ) {
			scrollingElement.scrollTop = previousScrollTop.current;
		}
	}

	return setLocked;
}

let lockCounter = 0;

/**
 *
 * @param {Object} props
 * @param {string} [props.className]
 * @return {null} Render nothing.
 */
export default function ScrollLock( { className = 'lockscroll' } ) {
	const setLocked = useSetLocked( className );

	useEffect( () => {
		if ( lockCounter === 0 ) {
			setLocked( true );
		}

		++lockCounter;

		return () => {
			if ( lockCounter === 1 ) {
				setLocked( false );
			}

			--lockCounter;
		};
	}, [] );

	return null;
}
