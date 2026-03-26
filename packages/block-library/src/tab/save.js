/**
 * WordPress dependencies
 */
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { anchor } = attributes;

	const tabPanelId = anchor;

	const blockProps = useBlockProps.save( {
		role: 'tabpanel',
	} );
	const innerBlocksProps = useInnerBlocksProps.save( blockProps );

	return <section { ...innerBlocksProps } id={ tabPanelId } />;
}
