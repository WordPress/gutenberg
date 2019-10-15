/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

export default function Save() {
	return <li><InnerBlocks.Content /></li>;
}
