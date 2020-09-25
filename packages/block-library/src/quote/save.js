/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';
import { getBlockProps } from '@wordpress/blocks';

export default function save( { attributes } ) {
	const { align, value, citation } = attributes;

	const className = classnames( {
		[ `has-text-align-${ align }` ]: align,
	} );

	return (
		<blockquote { ...getBlockProps( { className } ) }>
			<RichText.Content multiline value={ value } />
			{ ! RichText.isEmpty( citation ) && (
				<RichText.Content tagName="cite" value={ citation } />
			) }
		</blockquote>
	);
}
