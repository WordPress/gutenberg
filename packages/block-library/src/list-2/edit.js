/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

const allowedBlocks = [ 'core/list-item' ];
const template = [
	[ 'core/list-item', {}, [
		[ 'core/paragraph' ],
	] ],
];

export default function Edit() {
	return (
		<ul>
			<InnerBlocks
				allowedBlocks={ allowedBlocks }
				template={ template }
			/>
		</ul>
	);
}
