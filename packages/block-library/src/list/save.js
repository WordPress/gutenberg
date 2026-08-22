import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';
import { getListBlockGapProps } from './utils';

export default function save( { attributes } ) {
	const { ordered, type, reversed, start, style } = attributes;
	const gapProps = getListBlockGapProps( style );
	const TagName = ordered ? 'ol' : 'ul';
	return (
		<TagName
			{ ...useBlockProps.save( {
				className: gapProps.className,
				reversed,
				start,
				style: {
					listStyleType:
						ordered && type !== 'decimal' ? type : undefined,
					...gapProps.style,
				},
			} ) }
		>
			<InnerBlocks.Content />
		</TagName>
	);
}
