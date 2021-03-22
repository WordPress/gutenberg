/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';

export default function PreserveScrollInReorder() {
	deprecated( 'PreserveScrollInReorder component', {
		since: '6.6',
		hint: 'This behavior is now built-in the block list',
	} );
	return null;
}
