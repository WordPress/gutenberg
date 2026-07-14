/**
 * External dependencies
 */
import type { Ref } from 'react';

/**
 * WordPress dependencies
 */
import { useResizeObserver } from '@wordpress/compose';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useWidgetHeaderAvailableSize } from '../widget-header/widget-header-size';

interface InlineControlsFitOptions {
	/**
	 * Inline size (px) already claimed by fixed toolbar controls that are
	 * not part of the collapse.
	 */
	reservedSize?: number;

	/**
	 * Holds the current presentation while the user interacts with it (an
	 * open dropdown, focus inside the inline form). Measurements keep
	 * flowing; the pending transition applies when the hold releases.
	 */
	locked?: boolean;
}

interface InlineControlsFit {
	/**
	 * Ref for the element wrapping the inline controls at their natural
	 * width. While mounted, the measurement tracks it live; when the caller
	 * unmounts it (collapsed presentation), the last value is retained and
	 * drives the expand-back decision, and remounting re-measures it.
	 */
	measureRef: Ref< HTMLDivElement >;

	/**
	 * Whether the inline controls exceed the header's budget and the
	 * collapsed presentation should show instead.
	 */
	collapsed: boolean;
}

/**
 * Decides whether the inline attribute controls fit the space the header
 * row can grant its toolbar.
 *
 * @param {InlineControlsFitOptions} [options] Fit options.
 */
export function useInlineControlsFit(
	options: InlineControlsFitOptions = {}
): InlineControlsFit {
	const { reservedSize = 0, locked = false } = options;

	const availableSize = useWidgetHeaderAvailableSize();
	const [ naturalSize, setNaturalSize ] = useState( 0 );

	const measureRef = useResizeObserver< HTMLDivElement >( ( [ entry ] ) =>
		setNaturalSize( entry.contentRect.width )
	);

	// The zero guards keep environments without layout (JSDOM) on the
	// inline presentation.
	const computed =
		availableSize !== null &&
		naturalSize > 0 &&
		naturalSize > availableSize - reservedSize;

	// The latch: while locked, the surface the user is interacting with
	// must not be replaced under them, so the last unlocked decision holds.
	// Releasing the lock lets the pending transition apply.
	const [ held, setHeld ] = useState( computed );
	if ( ! locked && held !== computed ) {
		setHeld( computed );
	}

	return { measureRef, collapsed: locked ? held : computed };
}
