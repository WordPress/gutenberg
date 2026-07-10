/**
 * External dependencies
 */
import {
	createPortal,
	findDOMNode,
	flushSync,
	/* eslint-disable react/no-deprecated */
	render,
	hydrate,
	unmountComponentAtNode,
	/* eslint-enable react/no-deprecated */
} from 'react-dom';
import { createRoot, hydrateRoot } from 'react-dom/client';

/**
 * Creates a portal into which a component can be rendered.
 *
 * @see https://react.dev/reference/react-dom/createPortal
 */
export { createPortal };

/**
 * Finds the dom node of a React component.
 *
 * @param {React.ComponentType} component Component's instance.
 */
export { findDOMNode };

/**
 * Forces React to flush any updates inside the provided callback synchronously.
 *
 * @see https://react.dev/reference/react-dom/flushSync
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
