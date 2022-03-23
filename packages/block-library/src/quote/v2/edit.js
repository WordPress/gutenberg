/**
 * WordPress dependencies
 */
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { BlockQuotation } from '@wordpress/components';

export default function QuoteEdit() {
	const blockProps = useBlockProps();
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		template: [ [ 'core/paragraph', {} ] ],
		templateInsertUpdatesSelection: true,
	} );

	return <BlockQuotation { ...innerBlocksProps } />;
}
