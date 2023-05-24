/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

export default function save( { attributes: { syncStatus } } ) {
	if ( syncStatus !== 'partial' ) {
		return null;
	}

	return <InnerBlocks.Content />;
}
