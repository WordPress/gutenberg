/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

export default function save( { className, align } ) {
	return (
		<div className={ className } style={ { textAlign: align } }>
			<InnerBlocks.Content />
		</div>
	);
}
