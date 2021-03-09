/**
 * WordPress dependencies
 */
import { useRef, useEffect } from '@wordpress/element';

/**
 * @param {string} className
 * @return {(locked: boolean) => void} Function allowing you to set whether scrolling is locked.
 */
function useSetLocked( className ) {
	/** @type {import('react').MutableRefObject<number>} */
	const previousScrollTop = useRef( 0 );

	/**
	 * @param {boolean} locked
	 */
	function setLocked( locked ) {
		const scrollingElement = document.scrollingElement || document.body;

		if ( locked ) {
			previousScrollTop.current = scrollingElement.scrollTop;
		}

		const methodName = locked ? 'add' : 'remove';
		scrollingElement.classList[ methodName ]( className );

		// Adding the class to the document element seems to be necessary in iOS.
		document.documentElement.classList[ methodName ]( className );

		if ( ! locked ) {
			scrollingElement.scrollTop = previousScrollTop.current;
		}
	}

	return setLocked;
}

/*
 * Setting `overflow: hidden` on html and body elements resets body scroll in iOS.
 * Save scroll top so we can restore it after locking scroll.
 *
 * NOTE: It would be cleaner and possibly safer to find a localized solution such
 * as preventing default on certain touchmove events.
 */
let lockCounter = 0;

/**
 * A component that will lock scrolling when it is mounted and unlock scrolling when it is unmounted.
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
