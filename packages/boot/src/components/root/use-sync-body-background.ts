import { useRef } from '@wordpress/element';
import { useIsomorphicLayoutEffect } from '@wordpress/compose';

/**
 * Reads the boot layout's computed background-color and mirrors it onto
 * `document.body` to avoid a jarring flash on macOS elastic-scroll bounce.
 * Snapshots and restores the previous inline value on unmount.
 *
 * Skipped when the rounded admin canvas experiment is active
 * (`.gutenberg-rounded-admin-canvas` on `body`): the dark frame color on
 * `body` / `#wpwrap` must stay visible on overscroll instead of the layout
 * surface color.
 *
 * TODO: Once the two top-level `ThemeProvider` instances can be merged, this
 * hook can be replaced with a CSS rule on `<body>`.
 * See https://github.com/WordPress/gutenberg/pull/78587#discussion_r3481698286
 *
 * @return Ref to attach to the layout root element.
 */
export default function useSyncBodyBackground() {
	const layoutRef = useRef< HTMLDivElement | null >( null );

	useIsomorphicLayoutEffect( () => {
		if ( ! layoutRef.current ) {
			return;
		}

		const body = layoutRef.current.ownerDocument.body;

		// Keep the admin chrome frame color when the rounded canvas experiment
		// (or a future Core equivalent) owns body / #wpwrap backgrounds.
		if ( body.classList.contains( 'gutenberg-rounded-admin-canvas' ) ) {
			return;
		}

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
