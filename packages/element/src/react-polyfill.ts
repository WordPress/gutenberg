/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import {
	findDOMNode as findDOMNodeBase,
	render as renderBase,
	hydrate as hydrateBase,
	unmountComponentAtNode as unmountComponentAtNodeBase,
} from './react-polyfill-base';

/**
 * Finds the DOM node of a React component instance.
 *
 * @deprecated since WordPress 7.1.0. Use DOM refs instead.
 * @see https://react.dev/reference/react-dom/findDOMNode
 *
 * @param      instance Component's instance.
 */
export function findDOMNode( instance: any ): Element | Text | null {
	deprecated( 'wp.element.findDOMNode', {
		since: '7.1',
		alternative: 'DOM refs',
		link: 'https://react.dev/reference/react-dom/findDOMNode',
	} );

	return findDOMNodeBase( instance );
}

/**
 * Renders a given element into the target DOM node.
 *
 * @deprecated since WordPress 6.2.0. Use `createRoot` instead.
 * @see https://react.dev/reference/react-dom/render
 *
 * @param      element   Element to render.
 * @param      container DOM node into which to render.
 * @param      callback  Optional callback called after render.
 */
export function render(
	element: React.ReactNode,
	container: Element,
	callback?: () => void
): void {
	deprecated( 'wp.element.render', {
		since: '6.2',
		alternative: 'wp.element.createRoot',
		link: 'https://react.dev/reference/react-dom/client/createRoot',
	} );

	renderBase( element, container, callback );
}

/**
 * Hydrates a given element into the target DOM node.
 *
 * @deprecated since WordPress 6.2.0. Use `hydrateRoot` instead.
 * @see https://react.dev/reference/react-dom/hydrate
 *
 * @param      element   Element to hydrate.
 * @param      container DOM node to hydrate.
 * @param      callback  Optional callback called after hydration.
 */
export function hydrate(
	element: React.ReactNode,
	container: Element,
	callback?: () => void
): void {
	deprecated( 'wp.element.hydrate', {
		since: '6.2',
		alternative: 'wp.element.hydrateRoot',
		link: 'https://react.dev/reference/react-dom/client/hydrateRoot',
	} );

	hydrateBase( element, container, callback );
}

/**
 * Removes any mounted element from the target DOM node.
 *
 * @deprecated since WordPress 6.2.0. Use `root.unmount()` instead.
 * @see https://react.dev/reference/react-dom/unmountComponentAtNode
 *
 * @param      container DOM node in which to unmount.
 * @return Whether the node was unmounted.
 */
export function unmountComponentAtNode( container: Element ): boolean {
	deprecated( 'wp.element.unmountComponentAtNode', {
		since: '6.2',
		alternative: 'root.unmount()',
		link: 'https://react.dev/reference/react-dom/client/createRoot#root-unmount',
	} );

	return unmountComponentAtNodeBase( container );
}
