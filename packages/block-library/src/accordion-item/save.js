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
	const blockProps = useBlockProps.save( {
		className: clsx( {
			'is-open': openByDefault,
		} ),
	} );
	const innerBlocksProps = useInnerBlocksProps.save( blockProps );
	return <div { ...innerBlocksProps } />;
}
