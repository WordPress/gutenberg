/**
 * External dependencies
 */
import { colord } from 'colord';

/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';

/*
 * Calculates and renders the format boundary style when the active formats
 * change.
 */
export function useBoundaryStyle( { record } ) {
	const ref = useRef();
	const { activeFormats = [], replacements, start } = record.current;
	const activeReplacement = replacements[ start ];
	useEffect( () => {
		// There's no need to recalculate the boundary styles if no formats are
		// active, because no boundary styles will be visible.
		if (
			( ! activeFormats || ! activeFormats.length ) &&
			! activeReplacement
		) {
			return;
		}

		const boundarySelector = '*[data-rich-text-format-boundary]';
		const element = ref.current.querySelector( boundarySelector );

		if ( ! element ) {
			return;
		}

		const { ownerDocument } = element;
		const { defaultView } = ownerDocument;
		const computedStyle = defaultView.getComputedStyle( element );
		const newColor = colord( computedStyle.color )
			.alpha( 0.2 )
			.toRgbString();
		// Key off the focused editing host rather than the rich text element:
		// when the writing flow wrapper is the host, the rich text element
		// itself never receives focus, so `.rich-text:focus` would never match.
		const selector = `[contenteditable="true"]:focus ${ boundarySelector }`;
		const rule = `background-color: ${ newColor }`;
		const style = `${ selector } {${ rule }}`;
		const globalStyleId = 'rich-text-boundary-style';

		let globalStyle = ownerDocument.getElementById( globalStyleId );

		if ( ! globalStyle ) {
			globalStyle = ownerDocument.createElement( 'style' );
			globalStyle.id = globalStyleId;
			ownerDocument.head.appendChild( globalStyle );
		}

		if ( globalStyle.innerHTML !== style ) {
			globalStyle.innerHTML = style;
		}
	}, [ activeFormats, activeReplacement ] );
	return ref;
}
