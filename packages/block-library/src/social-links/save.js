/**
 * WordPress dependencies
 */
import {
	InnerBlocks,
	__experimentalUseBlockWrapperProps as useBlockWrapperProps,
} from '@wordpress/block-editor';

export default function save() {
	return (
		<ul { ...useBlockWrapperProps.save() }>
			<InnerBlocks.Content />
		</ul>
	);
}
