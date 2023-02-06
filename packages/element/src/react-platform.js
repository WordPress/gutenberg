/**
 * External dependencies
 */
import {
	createPortal,
	findDOMNode,
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
 * Renders a given element into the target DOM node.
 *
 * @param {import('./react').WPElement} element Element to render.
 * @param {HTMLElement}                 target  DOM node into which element should be rendered.
 */
export { render };

/**
 * Hydrates a given element into the target DOM node.
 *
 * @param {import('./react').WPElement} element Element to hydrate.
 * @param {HTMLElement}                 target  DOM node into which element should be hydrated.
 */
export { hydrate };

/**
 * Creates a new React root for the target DOM node.
 *
 * @see https://reactjs.org/docs/react-dom-client.html#createroot
 */
export { createRoot };

/**
 * Creates a new React root for the target DOM node and hydrates it with a pre-generated markup.
 *
 * @see https://reactjs.org/docs/react-dom-client.html#hydrateroot
 */
export { hydrateRoot };

/**
 * Removes any mounted element from the target DOM node.
 *
 * @param {Element} target DOM node in which element is to be removed
 */
export { unmountComponentAtNode };
