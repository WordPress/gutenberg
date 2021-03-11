/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

/*
 * Setting `overflow: hidden` on html and body elements resets body scroll in iOS.
 * Save scroll top so we can restore it after locking scroll.
 *
 * NOTE: It would be cleaner and possibly safer to find a localized solution such
 * as preventing default on certain touchmove events.
 */
let previousScrollTop = 0;

/**
 * @param {boolean} locked
 * @param {string} className
 */
function setLocked( locked, className ) {
	const scrollingElement = document.scrollingElement || document.body;

	if ( locked ) {
		previousScrollTop = scrollingElement.scrollTop;
	}

	const methodName = locked ? 'add' : 'remove';
	scrollingElement.classList[ methodName ]( className );

	// Adding the class to the document element seems to be necessary in iOS.
	document.documentElement.classList[ methodName ]( className );

	if ( ! locked ) {
		scrollingElement.scrollTop = previousScrollTop;
	}
}

let lockCounter = 0;

/**
 * A component that will lock scrolling when it is mounted and unlock scrolling when it is unmounted.
 *
 * @param {Object} props
 * @param {string} [props.className]
 * @return {null} Render nothing.
 */
export default function ScrollLock( { className = 'lockscroll' } ) {
	useEffect( () => {
		if ( lockCounter === 0 ) {
			setLocked( true, className );
		}

		++lockCounter;

		return () => {
			if ( lockCounter === 1 ) {
				setLocked( false, className );
			}

			--lockCounter;
		};
	}, [ className ] );

	return null;
}
