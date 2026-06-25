/**
 * WordPress dependencies
 */
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

export default function save() {
	const blockProps = useBlockProps.save( {
		role: 'tabpanel',
		tabIndex: 0,
	} );
	const innerBlocksProps = useInnerBlocksProps.save( blockProps );

	return <section { ...innerBlocksProps } />;
}
