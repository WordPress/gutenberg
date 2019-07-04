/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

export default function PostContentEdit() {
	return <InnerBlocks templateLock={ false } />;
}
