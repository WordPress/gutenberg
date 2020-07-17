/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

export default function save( { attributes: { width } } ) {
	return (
		<div className={ `width-${ width }` }>
			<InnerBlocks.Content />
		</div>
	);
}
