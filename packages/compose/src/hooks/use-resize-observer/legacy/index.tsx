/**
 * External dependencies
 */
import type { ReactElement } from 'react';

/**
 * WordPress dependencies
 */
import { useCallback, useRef, useState } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { useResizeObserver } from '../use-resize-observer';

export type ObservedSize = {
	width: number | null;
	height: number | null;
};

// We're only using the first element of the size sequences, until future versions of the spec solidify on how
// exactly it'll be used for fragments in multi-column scenarios:
// From the spec:
// > The box size properties are exposed as FrozenArray in order to support elements that have multiple fragments,
// > which occur in multi-column scenarios. However the current definitions of content rect and border box do not
// > mention how those boxes are affected by multi-column layout. In this spec, there will only be a single
// > ResizeObserverSize returned in the FrozenArray, which will correspond to the dimensions of the first column.
// > A future version of this spec will extend the returned FrozenArray to contain the per-fragment size information.
// (https://drafts.csswg.org/resize-observer/#resize-observer-entry-interface)
//
// Also, testing these new box options revealed that in both Chrome and FF everything is returned in the callback,
// regardless of the "box" option.
// The spec states the following on this:
// > This does not have any impact on which box dimensions are returned to the defined callback when the event
// > is fired, it solely defines which box the author wishes to observe layout changes on.
// (https://drafts.csswg.org/resize-observer/#resize-observer-interface)
// I'm not exactly clear on what this means, especially when you consider a later section stating the following:
// > This section is non-normative. An author may desire to observe more than one CSS box.
// > In this case, author will need to use multiple ResizeObservers.
// (https://drafts.csswg.org/resize-observer/#resize-observer-interface)
// Which is clearly not how current browser implementations behave, and seems to contradict the previous quote.
// For this reason I decided to only return the requested size,
// even though it seems we have access to results for all box types.
// This also means that we get to keep the current api, being able to return a simple { width, height } pair,
// regardless of box option.
const extractSize = ( entry: ResizeObserverEntry ): ObservedSize => {
	let entrySize;
	if ( ! entry.contentBoxSize ) {
		// The dimensions in `contentBoxSize` and `contentRect` are equivalent according to the spec.
		// See the 6th step in the description for the RO algorithm:
		// https://drafts.csswg.org/resize-observer/#create-and-populate-resizeobserverentry-h
		// > Set this.contentRect to logical this.contentBoxSize given target and observedBox of "content-box".
		// In real browser implementations of course these objects differ, but the width/height values should be equivalent.
		entrySize = [ entry.contentRect.width, entry.contentRect.height ];
	} else if ( entry.contentBoxSize[ 0 ] ) {
		const contentBoxSize = entry.contentBoxSize[ 0 ];
		entrySize = [ contentBoxSize.inlineSize, contentBoxSize.blockSize ];
	} else {
		// TS complains about this, because the RO entry type follows the spec and does not reflect Firefox's buggy
		// behaviour of returning objects instead of arrays for `borderBoxSize` and `contentBoxSize`.
		const contentBoxSize =
			entry.contentBoxSize as unknown as ResizeObserverSize;
		entrySize = [ contentBoxSize.inlineSize, contentBoxSize.blockSize ];
	}

	const [ width, height ] = entrySize.map( ( d ) => Math.round( d ) );
	return { width, height };
};

const RESIZE_ELEMENT_STYLES = {
	position: 'absolute',
	top: 0,
	left: 0,
	right: 0,
	bottom: 0,
	pointerEvents: 'none',
	opacity: 0,
	overflow: 'hidden',
	zIndex: -1,
} as const;

type ResizeElementProps = {
	onResize: ( s: ObservedSize ) => void;
};

function ResizeElement( { onResize }: ResizeElementProps ) {
	const resizeElementRef = useResizeObserver( ( entries ) => {
		const newSize = extractSize( entries.at( -1 )! ); // Entries are never empty.
		onResize( newSize );
	} );

	return (
		<div
			ref={ resizeElementRef }
			style={ RESIZE_ELEMENT_STYLES }
			aria-hidden="true"
		/>
	);
}

function sizeEquals( a: ObservedSize, b: ObservedSize ) {
	return a.width === b.width && a.height === b.height;
}

const NULL_SIZE: ObservedSize = { width: null, height: null };

/**
 * Hook which allows to listen to the resize event of any target element when it changes size.
 * _Note: `useResizeObserver` will report `null` sizes until after first render.
 *
 * @example
 *
 * ```js
 * const App = () => {
 * 	const [ resizeListener, sizes ] = useResizeObserver();
 *
 * 	return (
 * 		<div>
 * 			{ resizeListener }
 * 			Your content here
 * 		</div>
 * 	);
 * };
 * ```
 */
export default function useLegacyResizeObserver(): [
	ReactElement,
	ObservedSize,
] {
	const [ size, setSize ] = useState( NULL_SIZE );

	// Using a ref to track the previous width / height to avoid unnecessary renders.
	const previousSizeRef = useRef( NULL_SIZE );

	const handleResize = useCallback( ( newSize: ObservedSize ) => {
		if ( ! sizeEquals( previousSizeRef.current, newSize ) ) {
			previousSizeRef.current = newSize;
			setSize( newSize );
		}
	}, [] );

	const resizeElement = <ResizeElement onResize={ handleResize } />;
	return [ resizeElement, size ];
}
