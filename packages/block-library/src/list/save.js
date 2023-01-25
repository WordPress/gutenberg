/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { align, ordered, position, type, reversed, start } = attributes;
	const className = classnames( {
		[ `has-text-align-${ align }` ]: align,
		[ `list-style-position-${
			position === false ? 'outside' : 'inside'
		}` ]: position,
	} );
	const TagName = ordered ? 'ol' : 'ul';
	return (
		<TagName
			{ ...useBlockProps.save( { className, type, reversed, start } ) }
		>
			<InnerBlocks.Content />
		</TagName>
	);
}
