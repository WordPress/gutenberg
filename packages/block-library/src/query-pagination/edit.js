/**
 * WordPress dependencies
 */
import {
	useBlockProps,
	__experimentalUseInnerBlocksProps as useInnerBlocksProps,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import QueryPaginationProvider from './query-pagination-provider';

const TEMPLATE = [
	[ 'core/query-pagination-previous' ],
	[ 'core/query-pagination-numbers' ],
	[ 'core/query-pagination-next' ],
];

export default function QueryPaginationEdit( { clientId } ) {
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
	return (
		<QueryPaginationProvider clientId={ clientId }>
			<div { ...innerBlocksProps } />
		</QueryPaginationProvider>
	);
}
