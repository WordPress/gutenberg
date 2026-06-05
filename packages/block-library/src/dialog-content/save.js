/**
 * WordPress dependencies
 */
import { useBlockProps, InnerBlocks } from '@wordpress/block-editor';

export default function save() {
	const blockProps = useBlockProps.save();

	return (
		<dialog { ...blockProps }>
			<div className="wp-block-dialog-content__inner">
				<InnerBlocks.Content />
			</div>
		</dialog>
	);
}
