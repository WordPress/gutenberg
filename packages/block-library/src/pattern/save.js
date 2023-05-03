/**
 * WordPress dependencies
 */
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

export default function save( { attributes: { inheritedAlignment } } ) {
	const blockProps = useBlockProps.save( {
		className: inheritedAlignment && `align${ inheritedAlignment }`,
	} );
	const innerBlocksProps = useInnerBlocksProps.save( blockProps );
	return <div { ...innerBlocksProps }>{ innerBlocksProps.children }</div>;
}
