/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { useResizeObserver } from '@wordpress/compose';

const SKELETON_BODY_HEIGHT_CSS_PROP = '--wp-editor--body-height';

export function useObserveInterfaceHeight( { ref } ) {
	const [ resizeListener, sizes ] = useResizeObserver();

	/*
	 * This calculates and sets a body height for the inner
	 * content, sidebar, and complementary areas. This improves performance,
	 * as we can avoid having the browser (re)calculate layout values on
	 * interaction (e.g. typing).
	 */
	const setBodyHeightValue = () => {
		const bodyHeight = ref.current?.clientHeight;
		if ( bodyHeight ) {
			const nextHeight = window.innerHeight - bodyHeight;
			// We're using calc with a 100vh offset improve responsiveness
			// when resizing the browser's height. Using a fixed pixel value
			// directly may result in double scrollbar flickering.
			const nextHeightValue = `calc(100vh - ${ nextHeight }px)`;

			// We'll set the value as a custom CSS variable.
			// The inner content, sidebar, and complementary areas are
			// "subscribed" to this value using CSS.
			document.documentElement.style.setProperty(
				SKELETON_BODY_HEIGHT_CSS_PROP,
				nextHeightValue
			);
		}
	};

	useEffect( setBodyHeightValue, [ sizes.height ] );

	return { resizeListener };
}
