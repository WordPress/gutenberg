/**
 * WordPress dependencies
 */
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

export default function save() {
	const innerBlocksProps = useInnerBlocksProps.save( useBlockProps.save() );
	return <div { ...innerBlocksProps } />;
}
