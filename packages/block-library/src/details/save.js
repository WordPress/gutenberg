import { RichText, useBlockProps, InnerBlocks } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { name, showContent, summaryAlign } = attributes;
	const summary = attributes.summary ? attributes.summary : 'Details';
	const blockProps = useBlockProps.save();

	return (
		<details
			{ ...blockProps }
			name={ name || undefined }
			open={ showContent }
		>
			<summary
				className={
					summaryAlign
						? `has-text-align-${ summaryAlign }`
						: undefined
				}
			>
				<RichText.Content value={ summary } />
			</summary>
			<InnerBlocks.Content />
		</details>
	);
}
