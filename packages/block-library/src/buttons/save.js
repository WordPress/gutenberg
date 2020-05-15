/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { orientation } = attributes;
	return (
		<div
			className={
				orientation === 'vertical' ? 'is-direction-vertical' : ''
			}
		>
			<InnerBlocks.Content />
		</div>
	);
}
