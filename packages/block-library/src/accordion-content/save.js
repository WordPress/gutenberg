/**
 * WordPress dependencies
 */
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
/**
 * External dependencies
 */
import clsx from 'clsx';

export default function save( { attributes } ) {
	const { openByDefault } = attributes;
	const blockProps = useBlockProps.save();
	const className = clsx(
		{
			'is-open': openByDefault,
		},
		blockProps.className
	);
	const innerBlocksProps = useInnerBlocksProps.save( {
		...blockProps,
		className,
	} );

	return <div { ...innerBlocksProps } />;
}
