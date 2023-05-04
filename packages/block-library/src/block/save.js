/**
 * WordPress dependencies
 */
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

export default function save( { attributes: { type }, innerBlocks } ) {
	if ( type === 'reusable' ) {
		return;
	}

	if ( type === 'pattern' ) {
		if ( innerBlocks?.length === 0 ) {
			return;
		}

		const blockProps = useBlockProps.save();
		const innerBlocksProps = useInnerBlocksProps.save( blockProps );
		return <div { ...innerBlocksProps }>{ innerBlocksProps.children }</div>;
	}
}
