/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';
import { useIsomorphicLayoutEffect } from '@wordpress/compose';

/**
 * Reads the boot layout's computed background-color and mirrors it onto
 * `document.body` to avoid a jarring flash on macOS elastic-scroll bounce.
 * Snapshots and restores the previous inline value on unmount.
 *
 * TODO: Once the two top-level `ThemeProvider` instances can be merged, this
 * hook can be replaced with a CSS rule on `<body>`.
 * See https://github.com/WordPress/gutenberg/pull/78587#discussion_r3481698286
 *
 * @return Ref to attach to the `.boot-layout` div.
 */
export default function useSyncBodyBackground() {
	const layoutRef = useRef< HTMLDivElement | null >( null );

	useIsomorphicLayoutEffect( () => {
		if ( ! layoutRef.current ) {
			return;
		}

		const body = layoutRef.current.ownerDocument.body;
		const bg = getComputedStyle( layoutRef.current ).backgroundColor;
		if ( ! bg ) {
			return;
		}

		const previousBackground = body.style.background;
		body.style.background = bg;

		return () => {
			body.style.background = previousBackground;
		};
	}, [] );

	return layoutRef;
}
