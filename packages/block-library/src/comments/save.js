/**
 * WordPress dependencies
 */
import { useInnerBlocksProps, useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes: { tagName: Tag, legacy } } ) {
	const blockProps = useBlockProps.save();
	const innerBlocksProps = useInnerBlocksProps.save( blockProps );

	// The legacy version is dynamic (i.e. PHP rendered) and doesn't allow inner
	// blocks, so nothing is saved in that case.
	return legacy ? null : <Tag { ...innerBlocksProps } />;
}
