/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { verticalAlignment, width } = attributes;

	const wrapperClasses = classnames( {
		[ `is-vertically-aligned-${ verticalAlignment }` ]: verticalAlignment,
	} );

	let style;
	if ( width ) {
		style = { flexBasis: width };
	}

	return (
		<div
			{ ...useBlockProps.save( {
				className: wrapperClasses,
				style,
			} ) }
		>
			<InnerBlocks.Content />
		</div>
	);
}
