/**
 * Internal dependencies
 */
import { ServerSideRenderWithPostId } from './server-side-render';
import { useServerSideRender } from './hook';

/**
 * A compatibility layer for the `ServerSideRender` component when used with `wp` global namespace.
 *
 * @deprecated Use `ServerSideRender` non-default export instead.
 *
 * @example
 * ```js
 * import ServerSideRender from '@wordpress/server-side-render';
 * ```
 */
const ServerSideRenderCompat = ServerSideRenderWithPostId;
ServerSideRenderCompat.ServerSideRender = ServerSideRenderWithPostId;
ServerSideRenderCompat.useServerSideRender = useServerSideRender;

export { ServerSideRenderWithPostId as ServerSideRender };
export { useServerSideRender };
export default ServerSideRenderCompat;
