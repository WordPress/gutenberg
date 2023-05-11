/**
 * WordPress dependencies
 */
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

export default function save( { attributes: { syncStatus }, innerBlocks } ) {
	if ( innerBlocks?.length === 0 && syncStatus !== 'partial' ) {
		return;
	}
	const blockProps = useBlockProps.save();
	const innerBlocksProps = useInnerBlocksProps.save( blockProps );
	return <div { ...innerBlocksProps }>{ innerBlocksProps.children }</div>;
}
