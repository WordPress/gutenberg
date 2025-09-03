/**
 * WordPress dependencies
 */
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

export default function Edit( { attributes } ) {
	const { allowedBlocks, templateLock, openByDefault, isSelected } =
		attributes;

	const blockProps = useBlockProps();
	const innerBlocksProps = useInnerBlocksProps( {
		allowedBlocks,
		template: [ [ 'core/paragraph', {} ] ],
		templateLock,
	} );

	return (
		<div { ...blockProps } aria-hidden={ ! isSelected && ! openByDefault }>
			<div { ...innerBlocksProps } />
		</div>
	);
}
