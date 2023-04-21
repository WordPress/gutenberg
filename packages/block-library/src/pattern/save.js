/**
 * WordPress dependencies
 */
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	if ( ! attributes.unsynced ) {
		return null;
	}
	const blockProps = useBlockProps.save();
	const innerBlocksProps = useInnerBlocksProps.save( blockProps );
	return (
		<div { ...{ ...innerBlocksProps } }>{ innerBlocksProps.children }</div>
	);
}
