/**
 * WordPress dependencies
 */
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

export default function Save( { attributes } ) {
	// eslint-disable-next-line react-compiler/react-compiler
	const blockProps = useBlockProps.save();

	// eslint-disable-next-line react-compiler/react-compiler
	const innerBlocksProps = useInnerBlocksProps.save( {} );

	const title = attributes?.metadata?.name || 'Tab Contents';

	return (
		<div { ...blockProps }>
			<h3 className="tabs__title">{ title }</h3>
			<ul className="tabs__list"></ul>
			{ innerBlocksProps.children }
		</div>
	);
}
