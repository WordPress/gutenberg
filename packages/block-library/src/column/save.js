/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

export default function save( { attributes, getBlockProps } ) {
	const { verticalAlignment, width } = attributes;

	const wrapperClasses = classnames( {
		[ `is-vertically-aligned-${ verticalAlignment }` ]: verticalAlignment,
	} );

	let style;
	if ( Number.isFinite( width ) ) {
		style = { flexBasis: width + '%' };
	}

	return (
		<div { ...getBlockProps( { className: wrapperClasses, style } ) }>
			<InnerBlocks.Content />
		</div>
	);
}
