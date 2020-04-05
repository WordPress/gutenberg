/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { blockDirection } = attributes;
	return (
		<div className={ `is-direction-${ blockDirection }` }>
			<InnerBlocks.Content />
		</div>
	);
}
