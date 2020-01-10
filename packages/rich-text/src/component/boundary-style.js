/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

/**
 * Global stylesheet shared by all RichText instances.
 */
const globalStyle = document.createElement( 'style' );

const boundarySelector = '*[data-rich-text-format-boundary]';

document.head.appendChild( globalStyle );

/**
 * Calculates and renders the format boundary style when the active formats
 * change.
 */
export function BoundaryStyle( { activeFormats, forwardedRef } ) {
	useEffect( () => {
		// There's no need to recalculate the boundary styles if no formats are
		// active, because no boundary styles will be visible.
		if ( ! activeFormats || ! activeFormats.length ) {
			return;
		}

		const element = forwardedRef.current.querySelector( boundarySelector );

		if ( ! element ) {
			return;
		}

		const computedStyle = window.getComputedStyle( element );
		const newColor = computedStyle.color
			.replace( ')', ', 0.2)' )
			.replace( 'rgb', 'rgba' );
		const selector = `.rich-text:focus ${ boundarySelector }`;
		const rule = `background-color: ${ newColor }`;
		const style = `${ selector } {${ rule }}`;

		if ( globalStyle.innerHTML !== style ) {
			globalStyle.innerHTML = style;
		}
	}, [ activeFormats ] );
	return null;
}
