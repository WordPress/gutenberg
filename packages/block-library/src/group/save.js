/**
 * WordPress dependencies
 */
import { useInnerBlocksProps, useBlockProps } from '@wordpress/block-editor';

export default function save( {
	attributes: { tagName: Tag, slug },
	innerBlocks,
} ) {
	if ( slug && innerBlocks?.length === 0 ) {
		return;
	}
	return <Tag { ...useInnerBlocksProps.save( useBlockProps.save() ) } />;
}
