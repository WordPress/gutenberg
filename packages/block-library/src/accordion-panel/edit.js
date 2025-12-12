/**
 * WordPress dependencies
 */
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

export default function Edit( { attributes } ) {
	const { allowedBlocks, templateLock, openByDefault, isSelected } =
		attributes;

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
