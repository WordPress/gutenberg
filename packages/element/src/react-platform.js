/**
 * External dependencies
 */
import {
	createPortal,
	findDOMNode,
	flushSync,
	render,
	hydrate,
	unmountComponentAtNode,
} from 'react-dom';
import { createRoot, hydrateRoot } from 'react-dom/client';

/**
 * Creates a portal into which a component can be rendered.
 *
 * @see https://github.com/facebook/react/issues/10309#issuecomment-318433235
 *
 * @param {import('./react').WPElement} child     Any renderable child, such as an element,
 *                                                string, or fragment.
 * @param {HTMLElement}                 container DOM node into which element should be rendered.
 */
export { createPortal };

/**
 * Finds the dom node of a React component.
 *
 * @param {import('./react').WPComponent} component Component's instance.
 */
export { findDOMNode };

/**
 * Forces React to flush any updates inside the provided callback synchronously.
 *
 * @param {Function} callback Callback to run synchronously.
 */
export { flushSync };

/**
 * Renders a given element into the target DOM node.
 *
 * @deprecated since WordPress 6.2.0. Use `createRoot` instead.
 * @see https://react.dev/reference/react-dom/render
 */
export { render };

/**
 * Hydrates a given element into the target DOM node.
 *
 * @deprecated since WordPress 6.2.0. Use `hydrateRoot` instead.
 * @see https://react.dev/reference/react-dom/hydrate
 */
export { hydrate };

/**
 * Creates a new React root for the target DOM node.
 *
 * @since 6.2.0 Introduced in WordPress core.
 * @see https://react.dev/reference/react-dom/client/createRoot
 */
export { createRoot };

/**
 * Creates a new React root for the target DOM node and hydrates it with a pre-generated markup.
 *
 * @since 6.2.0 Introduced in WordPress core.
 * @see https://react.dev/reference/react-dom/client/hydrateRoot
 */
export { hydrateRoot };

/**
 * Removes any mounted element from the target DOM node.
 *
 * @deprecated since WordPress 6.2.0. Use `root.unmount()` instead.
 * @see https://react.dev/reference/react-dom/unmountComponentAtNode
 */
export { unmountComponentAtNode };
