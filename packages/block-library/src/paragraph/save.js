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
	const { align, content, dropCap, direction } = attributes;
	const className = classnames( {
		'has-drop-cap': dropCap,
		[ `has-text-align-${ align }` ]: align,
	} );

	return (
		<p { ...getBlockProps( { className, dir: direction } ) }>
			<RichText.Content value={ content } />
		</p>
	);
}
