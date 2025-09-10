/**
 * External Dependencies
 */

/**
 * WordPress Dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

/**
 * Save function for the Dialog block.
 * @param {Object} props            Properties passed to the function.
 * @param {Object} props.attributes Available block attributes.
 * @return {WPElement} Element to render.
 */
export default function Save() {
	return <InnerBlocks.Content />;
}
