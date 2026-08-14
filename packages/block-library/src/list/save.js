import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { ordered, type, reversed, start, layout } = attributes;
	const TagName = ordered ? 'ol' : 'ul';
	return (
		<TagName
			{ ...useBlockProps.save( {
				reversed,
				start,
				className:
					layout?.contentSize || layout?.wideSize
						? 'has-custom-content-size'
						: undefined,
				style: {
					listStyleType:
						ordered && type !== 'decimal' ? type : undefined,
				},
			} ) }
		>
			<InnerBlocks.Content />
		</TagName>
	);
}
