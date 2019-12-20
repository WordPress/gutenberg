/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

export default function save( { className } ) {
	return (
		<ul className={ className }>
			<InnerBlocks.Content />
		</ul>
	);
}
