/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';

/**
 * Function to resize the editor window.
 *
 * @deprecated This hook is deprecated and no longer does anything.
 */
export default function useResizeCanvas() {
	deprecated( 'wp.blockEditor.useResizeCanvas', {
		since: '7.1',
		hint: 'This hook is deprecated and no longer does anything.',
	} );
}
