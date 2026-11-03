import { useEffect } from '@wordpress/element';
import type { RefObject } from 'react';
import type { RichTextRecord } from './types';

/*
 * Adds the format boundary style once a format is active.
 */
export function useBoundaryStyle( {
	record,
	ref,
}: {
	record: RefObject< RichTextRecord >;
	ref: RefObject< HTMLElement | undefined >;
} ) {
	const { activeFormats = [], replacements, start } = record.current;
	const activeReplacement =
		start === undefined ? undefined : replacements[ start ];
	useEffect( () => {
		// There's no need to add the boundary style if no formats are active,
		// because no boundary will be visible.
		if (
			( ! activeFormats || ! activeFormats.length ) &&
			! activeReplacement
		) {
			return;
		}

		const { ownerDocument } = ref.current!;
		const globalStyleId = 'rich-text-boundary-style';

		if ( ownerDocument.getElementById( globalStyleId ) ) {
			return;
		}

		const globalStyle = ownerDocument.createElement( 'style' );
		globalStyle.id = globalStyleId;
		// Only while the editing host has focus, be it the element or the
		// canvas root around it. Only the element with the selection renders
		// a boundary.
		globalStyle.innerHTML = `[contenteditable="true"]:focus *[data-rich-text-format-boundary] {background-color: color-mix(in srgb, currentColor 20%, transparent)}`;
		ownerDocument.head.appendChild( globalStyle );
	}, [ ref, activeFormats, activeReplacement ] );
}
