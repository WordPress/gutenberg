import clsx from 'clsx';
import { useInnerBlocksProps, useBlockProps } from '@wordpress/block-editor';
import { getColumnStyle } from './utils';

export default function save( { attributes } ) {
	const { verticalAlignment, style } = attributes;

	const wrapperClasses = clsx( {
		[ `is-vertically-aligned-${ verticalAlignment }` ]: verticalAlignment,
	} );

	const columnStyle = getColumnStyle( style?.dimensions?.width );

	const blockProps = useBlockProps.save( {
		className: wrapperClasses,
		style: columnStyle,
	} );
	const innerBlocksProps = useInnerBlocksProps.save( blockProps );

	return <div { ...innerBlocksProps } />;
}
