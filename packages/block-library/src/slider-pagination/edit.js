/**
 * WordPress dependencies
 */
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

const PAGINATION_TEMPLATE = [
	[ 'core/slider-pagination-button', { type: 'previous' } ],
	[ 'core/slider-pagination-indicator' ],
	[ 'core/slider-pagination-button', { type: 'next' } ],
];

export default function Edit() {
	const blockProps = useBlockProps();
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		template: PAGINATION_TEMPLATE,
		renderAppender: false,
	} );

	return <div { ...innerBlocksProps } />;
}
