/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';

/**
 * Previously returned inline styles that sized the editor canvas to emulate a
 * device preview width. Device preview is now handled by the editor's resizable
 * canvas, so this hook is a no-op kept for backward compatibility.
 *
 * @deprecated
 */
export default function useResizeCanvas() {
	deprecated( 'wp.blockEditor.useResizeCanvas', {
		since: '7.1',
		hint: 'Device preview is now handled by the editor canvas. This hook no longer does anything.',
	} );
}
