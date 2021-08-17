/**
 * External dependencies
 */
import {
	createPortal,
	findDOMNode,
	render,
	unmountComponentAtNode,
} from 'react-dom';

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
 * Removes any mounted element from the target DOM node.
 *
 * @param {Element} target DOM node in which element is to be removed
 */
export { unmountComponentAtNode };
