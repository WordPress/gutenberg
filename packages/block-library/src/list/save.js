import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { ordered, type, reversed, start, layout } = attributes;
	const TagName = ordered ? 'ol' : 'ul';
	const hasCustomContentSize = !! ( layout?.contentSize || layout?.wideSize );
	return (
		<TagName
			{ ...useBlockProps.save( {
				reversed,
				start,
				...( hasCustomContentSize
					? { className: 'has-custom-content-size' }
					: {} ),
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
