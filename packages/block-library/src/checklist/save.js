/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

export default function Save() {
	return <ul><InnerBlocks.Content /></ul>;
}
