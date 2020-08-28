/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { className } = attributes;

	return (
		<div className={ className }>
			<InnerBlocks.Content />
		</div>
	);
}
