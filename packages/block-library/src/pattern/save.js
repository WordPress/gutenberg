/**
 * WordPress dependencies
 */
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

export default function save( {
	attributes: { inheritedAlignment, syncStatus },
	innerBlocks,
} ) {
	if ( innerBlocks?.length === 0 || syncStatus !== 'partial' ) {
		return;
	}
	const blockProps = useBlockProps.save( {
		className: inheritedAlignment && `align${ inheritedAlignment }`,
	} );
	const innerBlocksProps = useInnerBlocksProps.save( blockProps );
	return <div { ...innerBlocksProps }>{ innerBlocksProps.children }</div>;
}
