/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

const ALLOWED_BLOCKS = [ 'core/navigation' ];

export default function NavigationAreaInnerBlocks( { navigationMenuId } ) {
	const template = useMemo(
		() => [ [ 'core/navigation', { navigationMenuId } ] ],
		[ navigationMenuId ]
	);

	const blockProps = useBlockProps();
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		orientation: 'horizontal',
		renderAppender: false,
		template,
		templateLock: 'all',
		allowedBlocks: ALLOWED_BLOCKS,
	} );
	return <div { ...innerBlocksProps } />;
}
