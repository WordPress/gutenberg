/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

export default function save( { attributes, getBlockProps } ) {
	const { verticalAlignment } = attributes;

	const className = classnames( {
		[ `are-vertically-aligned-${ verticalAlignment }` ]: verticalAlignment,
	} );

	return (
		<div { ...getBlockProps( { className } ) }>
			<InnerBlocks.Content />
		</div>
	);
}
