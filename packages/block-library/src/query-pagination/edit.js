/**
 * WordPress dependencies
 */
import {
	useBlockProps,
	__experimentalUseInnerBlocksProps as useInnerBlocksProps,
} from '@wordpress/block-editor';

const TEMPLATE = [
	[ 'core/query-pagination-previous' ],
	[ 'core/query-pagination-numbers' ],
	[ 'core/query-pagination-next' ],
];

export default function QueryPaginationEdit() {
	const blockProps = useBlockProps();
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		template: TEMPLATE,
		allowedBlocks: [
			'core/query-pagination-previous',
			'core/query-pagination-numbers',
			'core/query-pagination-next',
		],
		orientation: 'horizontal',
	} );
	return <div { ...innerBlocksProps } />;
}
