import { useLayoutEffect } from '@wordpress/element';

interface StyleEntry {
	element: HTMLStyleElement;
	refCount: number;
}

const styleRefs = new Map< string, StyleEntry >();

/**
 * Injects a `<style>` element into the document head, ref-counted so that
 * multiple consumers sharing the same CSS text use a single `<style>` element
 * (e.g. on the Docs tab where several stories render simultaneously). The
 * element is removed from the DOM when the last consumer unmounts.
 *
 * @param cssText The CSS text to inject. Pass an empty string to skip
 *                injection.
 */
export function useSharedStyle( cssText: string ): void {
	useLayoutEffect( () => {
		if ( ! cssText ) {
			return;
		}

		let entry = styleRefs.get( cssText );

		if ( entry ) {
			entry.refCount++;
		} else {
			const style = document.createElement( 'style' );
			style.textContent = cssText;
			document.head.appendChild( style );
			entry = { element: style, refCount: 1 };
			styleRefs.set( cssText, entry );
		}

		return () => {
			entry.refCount--;
			if ( entry.refCount === 0 ) {
				entry.element.remove();
				styleRefs.delete( cssText );
			}
		};
	}, [ cssText ] );
}
