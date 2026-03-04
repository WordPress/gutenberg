import { useLayoutEffect } from '@wordpress/element';

interface StyleEntry {
	element: HTMLStyleElement;
	refCount: number;
}

const styleRefs = new Map< string, StyleEntry >();

/**
 * Injects a `<style>` element into the document head, ref-counted by `key`.
 *
 * When multiple Storybook story instances need the same stylesheet (e.g. on
 * the Docs tab where several stories render simultaneously), this hook ensures
 * only a single `<style>` element is created. It is removed from the DOM when
 * the last consumer unmounts.
 *
 * @param options
 * @param options.key     A unique identifier for the stylesheet. Callers with
 *                        the same key share one `<style>` element. Pass an
 *                        empty string to skip injection.
 * @param options.cssText The CSS text to inject. Pass an empty string to skip
 *                        injection.
 */
export function useSharedStyle( {
	key,
	cssText,
}: {
	key: string;
	cssText: string;
} ): void {
	useLayoutEffect( () => {
		if ( ! key || ! cssText ) {
			return;
		}

		let entry = styleRefs.get( key );

		if ( entry ) {
			entry.refCount++;
		} else {
			const style = document.createElement( 'style' );
			style.textContent = cssText;
			document.head.appendChild( style );
			entry = { element: style, refCount: 1 };
			styleRefs.set( key, entry );
		}

		return () => {
			entry.refCount--;
			if ( entry.refCount === 0 ) {
				entry.element.remove();
				styleRefs.delete( key );
			}
		};
	}, [ key, cssText ] );
}
