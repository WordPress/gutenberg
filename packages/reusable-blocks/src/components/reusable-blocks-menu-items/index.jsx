import deprecated from '@wordpress/deprecated';

/**
 * Deprecated no-op ReusableBlocksMenuItems component.
 *
 * @return {null} Nothing.
 */
export default function ReusableBlocksMenuItems() {
	deprecated( 'wp.reusableBlocks.ReusableBlocksMenuItems', {
		since: '7.1',
	} );
	return null;
}
