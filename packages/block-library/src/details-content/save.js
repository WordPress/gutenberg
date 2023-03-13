/**
 * WordPress dependencies
 */
import { useBlockProps, InnerBlocks } from '@wordpress/block-editor';
import { View } from '@wordpress/primitives';

export default function save() {
	const blockProps = useBlockProps.save();
	return (
		<View { ...blockProps }>
			<InnerBlocks.Content />
		</View>
	);
}
