/**
 * WordPress dependencies
 */
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { ordered, reversed, start } = attributes;
	const TagName = ordered ? 'ol' : 'ul';
	return (
		<TagName
			reversed={ reversed }
			start={ start }
			{ ...useBlockProps.save() }
		>
			<InnerBlocks.Content />
		</TagName>
	);
}
