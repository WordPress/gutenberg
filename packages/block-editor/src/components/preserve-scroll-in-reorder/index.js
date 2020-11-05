/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';

export default function PreserveScrollInReorder() {
	deprecated( 'PreserveScrollInReorder component', {
		hint: 'This behavior is now built-in the block list',
	} );
	return null;
}
