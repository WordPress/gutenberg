/**
 * External dependencies
 */
import { createPortal, flushSync } from 'react-dom';
import { createRoot, hydrateRoot } from 'react-dom/client';

/**
 * Creates a portal into which a component can be rendered.
 *
 * @see https://github.com/facebook/react/issues/10309#issuecomment-318433235
 *
 * @param {React.ReactElement} child     Any renderable child, such as an element,
 *                                       string, or fragment.
 * @param {HTMLElement}        container DOM node into which element should be rendered.
 */
export { createPortal };

/**
 * Forces React to flush any updates inside the provided callback synchronously.
 *
 * @param {Function} callback Callback to run synchronously.
 */
export { flushSync };

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
