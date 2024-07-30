/**
 * WordPress dependencies
 */
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { anchor, slug } = attributes;
	const tabPanelId = anchor || slug;

	// The first tab in the set is always active on initial load.
	const blockProps = useBlockProps.save();
	const innerBlocksProps = useInnerBlocksProps.save( blockProps );

	return <section { ...innerBlocksProps } id={ tabPanelId } />;
}
