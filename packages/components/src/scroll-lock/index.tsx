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

function setLocked( locked: boolean ) {
	const scrollingElement = document.scrollingElement || document.body;

	if ( locked ) {
		previousScrollTop = scrollingElement.scrollTop;
	}

	const methodName = locked ? 'add' : 'remove';
	scrollingElement.classList[ methodName ]( 'lockscroll' );

	// Adding the class to the document element seems to be necessary in iOS.
	document.documentElement.classList[ methodName ]( 'lockscroll' );

	if ( ! locked ) {
		scrollingElement.scrollTop = previousScrollTop;
	}
}

let lockCounter = 0;

/**
 * ScrollLock is a content-free React component for declaratively preventing
 * scroll bleed from modal UI to the page body. This component applies a
 * `lockscroll` class to the `document.documentElement` and
 * `document.scrollingElement` elements to stop the body from scrolling. When it
 * is present, the lock is applied.
 *
 * ```jsx
 * import { ScrollLock, Button } from '@wordpress/components';
 * import { useState } from '@wordpress/element';
 *
 * const MyScrollLock = () => {
 *   const [ isScrollLocked, setIsScrollLocked ] = useState( false );
 *
 *   const toggleLock = () => {
 *     setIsScrollLocked( ( locked ) => ! locked ) );
 *   };
 *
 *   return (
 *     <div>
 *       <Button variant="secondary" onClick={ toggleLock }>
 *         Toggle scroll lock
 *       </Button>
 *       { isScrollLocked && <ScrollLock /> }
 *       <p>
 *         Scroll locked:
 *         <strong>{ isScrollLocked ? 'Yes' : 'No' }</strong>
 *       </p>
 *     </div>
 *   );
 * };
 * ```
 */
export function ScrollLock(): null {
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

export default ScrollLock;
