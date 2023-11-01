/**
 * WordPress dependencies
 */
import { RichText, useBlockProps, InnerBlocks } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { showContent } = attributes;
	const summary = attributes.summary ? attributes.summary : 'Details';
	const blockProps = useBlockProps.save();

	return (
		<details { ...blockProps } open={ showContent }>
			<summary>
				<RichText.Content value={ summary } />
			</summary>
			<InnerBlocks.Content />
		</details>
	);
}
