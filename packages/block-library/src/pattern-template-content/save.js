/**
 * WordPress dependencies
 */
import { useInnerBlocksProps, useBlockProps } from '@wordpress/block-editor';

export default function save() {
	return <div { ...useInnerBlocksProps.save( useBlockProps.save() ) } />;
}
