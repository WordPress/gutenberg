/**
 * WordPress dependencies
 */
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
const TEMPLATE = [
	[ 'core/post-navigation-link', { type: 'previous' } ],
	[ 'core/post-navigation-link' ],
];

const ALLOWED_BLOCKS = [ 'core/post-navigation-link' ];

export default function PostNavigationEdit( attributes ) {
	const blockProps = useBlockProps();

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		template: TEMPLATE,
		allowedBlocks: ALLOWED_BLOCKS,
		templateLock: 'all',
		orientation: attributes.layout?.orientation ?? 'horizontal',
	} );
	return (
		<>
			<nav className="wp-block-post-navigation" { ...innerBlocksProps } />
		</>
	);
}
