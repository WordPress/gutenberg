/**
 * Internal dependencies
 */
import useClipboardHandler from '../writing-flow/use-clipboard-handler';

/**
 * @deprecated
 * @param {Object} props
 */
export default ( props ) => <div { ...props } ref={ useClipboardHandler() } />;
