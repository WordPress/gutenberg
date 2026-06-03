/**
 * External dependencies
 */
import {
	createPortal,
	flushSync,
	preconnect,
	prefetchDNS,
	preinit,
	preinitModule,
	preload,
	preloadModule,
	useFormStatus,
} from 'react-dom';
import { createRoot, hydrateRoot } from 'react-dom/client';

/**
 * Creates a portal into which a component can be rendered.
 *
 * @see https://react.dev/reference/react-dom/createPortal
 */
export { createPortal };

/**
 * Forces React to flush any updates inside the provided callback synchronously.
 *
 * @see https://react.dev/reference/react-dom/flushSync
 */
export { flushSync };

/**
 * Eagerly connect to a server that you expect to load resources from.
 *
 * @since 7.1.0
 * @see https://react.dev/reference/react-dom/preconnect
 */
export { preconnect };

/**
 * Eagerly look up the IP of a server that you expect to load resources from.
 *
 * @since 7.1.0
 * @see https://react.dev/reference/react-dom/prefetchDNS
 */
export { prefetchDNS };

/**
 * Eagerly fetch and evaluate a stylesheet or external script.
 *
 * @since 7.1.0
 * @see https://react.dev/reference/react-dom/preinit
 */
export { preinit };

/**
 * Eagerly fetch and evaluate an ESM module.
 *
 * @since 7.1.0
 * @see https://react.dev/reference/react-dom/preinitModule
 */
export { preinitModule };

/**
 * Eagerly fetch a resource such as a stylesheet, font, or external script.
 *
 * @since 7.1.0
 * @see https://react.dev/reference/react-dom/preload
 */
export { preload };

/**
 * Eagerly fetch an ESM module that you expect to use.
 *
 * @since 7.1.0
 * @see https://react.dev/reference/react-dom/preloadModule
 */
export { preloadModule };

/**
 * Read the status information of the parent form.
 *
 * @since 7.1.0
 * @see https://react.dev/reference/react-dom/hooks/useFormStatus
 */
export { useFormStatus };

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
