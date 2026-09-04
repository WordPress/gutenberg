import clsx from 'clsx';
import { useInnerBlocksProps, useBlockProps } from '@wordpress/block-editor';
import { getColumnFlexBasis } from './utils';

export default function save( { attributes } ) {
	const { verticalAlignment, style } = attributes;

	const wrapperClasses = clsx( {
		[ `is-vertically-aligned-${ verticalAlignment }` ]: verticalAlignment,
	} );

	const flexBasis = getColumnFlexBasis( style?.dimensions?.width );

	const blockProps = useBlockProps.save( {
		className: wrapperClasses,
		style: flexBasis ? { flexBasis } : undefined,
	} );
	const innerBlocksProps = useInnerBlocksProps.save( blockProps );

	return <div { ...innerBlocksProps } />;
}
