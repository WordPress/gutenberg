/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

const allowedBlocks = [ 'core/checklist-item' ];
const template = [
	[ 'core/checklist-item' ],
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
