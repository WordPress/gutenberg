/**
 * WordPress dependencies
 */
import { useInnerBlocksProps } from '@wordpress/block-editor';

export default function save() {
	const innerBlocksProps = useInnerBlocksProps.save();
	return innerBlocksProps.children;
}
