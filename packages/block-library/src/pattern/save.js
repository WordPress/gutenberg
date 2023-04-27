/**
 * WordPress dependencies
 */
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	if ( attributes.syncStatus === 'synced' ) {
		return null;
	}
	const blockProps = useBlockProps.save();
	const innerBlocksProps = useInnerBlocksProps.save( blockProps );
	return <>{ innerBlocksProps.children }</>;
}
