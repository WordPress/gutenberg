/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

export default function GridSave() {
	return <InnerBlocks.Content __experimentalGridMode />;
}
