/**
 * WordPress dependencies
 */
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

export default function save() {
	return <div { ...useInnerBlocksProps.save( useBlockProps.save() ) } />;
}
