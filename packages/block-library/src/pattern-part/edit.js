/**
 * WordPress dependencies
 */
import { useInnerBlocksProps, useBlockProps } from '@wordpress/block-editor';
export default function Edit() {
	const blockProps = useBlockProps();
	const innerBlocksProps = useInnerBlocksProps( blockProps );
	console.log( 'innerBlocksProps', innerBlocksProps.children );
	return <div { ...innerBlocksProps }></div>;
}
