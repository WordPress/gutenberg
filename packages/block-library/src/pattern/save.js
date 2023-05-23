/**
 * WordPress dependencies
 */
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

export default function save( {
	attributes: { syncStatus, slug },
	innerBlocks,
} ) {
	if ( innerBlocks?.length === 0 || syncStatus !== 'partial' ) {
		return;
	}
	//test
	const blockProps = useBlockProps.save( {
		className: slug?.replace( '/', '-' ),
	} );
	const innerBlocksProps = useInnerBlocksProps.save( blockProps );
	return <div { ...innerBlocksProps }>{ innerBlocksProps.children }</div>;
}
