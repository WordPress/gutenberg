/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import useClipboardHandler from '../writing-flow/use-clipboard-handler';

/* eslint-disable react-hooks/rules-of-hooks */
/**
 * @deprecated
 */
export const __unstableUseClipboardHandler = () => {
	deprecated( '__unstableUseClipboardHandler', {
		alternative: 'BlockCanvas or WritingFlow',
		since: '6.4',
		version: '6.7',
	} );
	return useClipboardHandler();
};
/* eslint-enable react-hooks/rules-of-hooks */

/**
 * @deprecated
 * @param {Object} props
 */
export default function CopyHandler( props ) {
	deprecated( 'CopyHandler', {
		alternative: 'BlockCanvas or WritingFlow',
		since: '6.4',
		version: '6.7',
	} );
	return <div { ...props } ref={ useClipboardHandler() } />;
}
