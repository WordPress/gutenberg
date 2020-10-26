/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useInnerBlocksProps, useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { verticalAlignment, width } = attributes;

	const wrapperClasses = classnames( {
		[ `is-vertically-aligned-${ verticalAlignment }` ]: verticalAlignment,
	} );

	let style;
	if ( width ) {
		style = { flexBasis: width };
	}

	const blockProps = useBlockProps.save( {
		className: wrapperClasses,
		style,
	} );
	const innerBlocksProps = useInnerBlocksProps.save( blockProps );

	return <div { ...innerBlocksProps } />;
}
