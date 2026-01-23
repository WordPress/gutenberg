/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

export default function save() {
	// Don't save wrapper - PHP renders it with directives
	// Just save the inner blocks (slides)
	return <InnerBlocks.Content />;
}
