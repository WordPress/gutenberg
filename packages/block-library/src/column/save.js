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
		// Numbers are handled for backward compatibility as they can be still provided with templates.
		let flexBasis = Number.isFinite( width ) ? width + '%' : width;
		// In some cases we need to round the width to a shorter float.
		if ( ! Number.isFinite( width ) && width?.endsWith( '%' ) ) {
			const multiplier = 1000000000000;
			// Shrink the number back to a reasonable float.
			flexBasis =
				Math.round( Number.parseFloat( width ) * multiplier ) /
					multiplier +
				'%';
		}
		style = { flexBasis };
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
