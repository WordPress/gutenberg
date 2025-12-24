/**
 * WordPress dependencies
 */
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

export default function Edit( { attributes, context } ) {
	const { allowedBlocks, templateLock, isSelected } = attributes;
	const openByDefault = context[ 'core/accordion-open-by-default' ];
	const blockProps = useBlockProps( {
		'aria-hidden': ! isSelected && ! openByDefault,
		role: 'region',
	} );

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks,
		template: [ [ 'core/paragraph', {} ] ],
		templateLock,
	} );

	return <div { ...innerBlocksProps } />;
}
