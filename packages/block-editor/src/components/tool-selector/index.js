/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';
import { forwardRef } from '@wordpress/element';

function ToolSelector() {
	deprecated( 'wp.blockEditor.ToolSelector', {
		since: '6.9',
		hint: 'The ToolSelector component no longer renders anything.',
	} );

	return null;
}

/**
 * This component has been deprecated and no longer renders anything.
 */
export default forwardRef( ToolSelector );
