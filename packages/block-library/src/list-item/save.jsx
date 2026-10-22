import { InnerBlocks, RichText, useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	return (
		<li
			{ ...useBlockProps.save( {
				value: attributes.value || undefined,
			} ) }
		>
			<RichText.Content value={ attributes.content } />
			<InnerBlocks.Content />
		</li>
	);
}
