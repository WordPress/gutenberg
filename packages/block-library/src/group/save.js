/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useInnerBlocksProps, useBlockProps } from '@wordpress/block-editor';

export default function save( {
	attributes: { tagName: Tag, verticalAlignment },
} ) {
	const className = classnames( {
		[ `is-vertically-aligned-${ verticalAlignment }` ]: verticalAlignment,
	} );

	return (
		<Tag
			{ ...useInnerBlocksProps.save(
				useBlockProps.save( { className } )
			) }
		/>
	);
}
