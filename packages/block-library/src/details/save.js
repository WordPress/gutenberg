/**
 * WordPress dependencies
 */
import { useBlockProps, InnerBlocks } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { showContent } = attributes;
	const blockProps = useBlockProps.save();

	return (
		<details { ...blockProps } open={ showContent }>
			<InnerBlocks.Content />
		</details>
	);
}
