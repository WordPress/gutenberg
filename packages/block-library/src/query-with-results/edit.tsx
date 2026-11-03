import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

export default function QueryWithResultsEdit() {
	const blockProps = useBlockProps();
	const innerBlocksProps = useInnerBlocksProps( blockProps );

	return <div { ...innerBlocksProps } />;
}
