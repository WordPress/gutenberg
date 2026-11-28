import clsx from 'clsx';
import { useInnerBlocksProps, useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { isStackedOnMobile, verticalAlignment } = attributes;

	const className = clsx( {
		[ `are-vertically-aligned-${ verticalAlignment }` ]: verticalAlignment,
		[ `is-not-stacked-on-mobile` ]: ! isStackedOnMobile,
	} );

	const blockProps = useBlockProps.save( { className } );
	const innerBlocksProps = useInnerBlocksProps.save( blockProps );

	return <div { ...innerBlocksProps } />;
}
