/**
 * WordPress dependencies
 */
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

export default function Save( { attributes } ) {
	const blockProps = useBlockProps.save();
	const innerBlocksProps = useInnerBlocksProps.save( blockProps );

	const title = attributes?.metadata?.name || 'Tab Contents';

	return (
		<div { ...innerBlocksProps }>
			<h3 className="tabs__title">{ title }</h3>
			{ innerBlocksProps.children }
		</div>
	);
}
