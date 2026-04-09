/**
 * WordPress dependencies
 */
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

export default function save() {
	const blockProps = useBlockProps.save( {
		role: 'group',
	} );
	return <div { ...useInnerBlocksProps.save( blockProps ) } />;
}
