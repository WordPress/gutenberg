/**
 * WordPress dependencies
 */
import { useEffect, useState, flushSync } from '@wordpress/element';
import { createQueue } from '@wordpress/priority-queue';

const blockPreviewQueue = createQueue();

/**
 * Renders a component at the next idle time.
 * @param {*} props
 */
export function Async( { children, placeholder } ) {
	const [ shouldRender, setShouldRender ] = useState( false );

	// In the future, we could try to use startTransition here, but currently
	// react will batch all transitions, which means all previews will be
	// rendered at the same time.
	// https://react.dev/reference/react/startTransition#caveats
	// > If there are multiple ongoing Transitions, React currently batches them
	// > together. This is a limitation that will likely be removed in a future
	// > release.

	useEffect( () => {
		const context = {};
		blockPreviewQueue.add( context, () => {
			// Synchronously run all renders so it consumes timeRemaining.
			// See https://github.com/WordPress/gutenberg/pull/48238
			flushSync( () => {
				setShouldRender( true );
			} );
		} );
		return () => {
			blockPreviewQueue.cancel( context );
		};
	}, [] );

	if ( ! shouldRender ) {
		return placeholder;
	}

	return children;
}
