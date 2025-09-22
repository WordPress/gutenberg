/**
 * WordPress dependencies
 */
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

export default function save() {
	const blockProps = useBlockProps.save();
	return <div { ...useInnerBlocksProps.save( blockProps ) } />;
}
