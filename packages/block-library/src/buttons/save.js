/**
 * WordPress dependencies
 */
import {
	InnerBlocks,
	__experimentalUseBlockWrapperProps as useBlockWrapperProps,
} from '@wordpress/block-editor';

export default function save() {
	return (
		<div { ...useBlockWrapperProps.save() }>
			<InnerBlocks.Content />
		</div>
	);
}
