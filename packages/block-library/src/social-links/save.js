/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

export default function save( { className } ) {
	return (
		<div className={ className }>
			<InnerBlocks.Content />
		</div>
	);
}
