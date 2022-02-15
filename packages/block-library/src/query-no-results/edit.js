/**
 * WordPress dependencies
 */
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

const TEMPLATE = [ [ 'core/paragraph' ] ];

export default function QueryNoResultsEdit() {
	const blockProps = useBlockProps();
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		template: TEMPLATE,
	} );
	return (
		<>
			<div { ...innerBlocksProps } />
		</>
	);
}
