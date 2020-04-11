/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { blockDirection } = attributes;
	return (
		<div
			className={
				blockDirection === 'vertical' ? 'is-direction-vertical' : ''
			}
		>
			<InnerBlocks.Content />
		</div>
	);
}
