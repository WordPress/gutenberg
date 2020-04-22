/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { align, content, dropCap, direction } = attributes;

	const className = classnames( {
		'has-drop-cap': dropCap,
		[ `has-text-align-${ align }` ]: align,
	} );

	return (
		<RichText.Content
			tagName="p"
			className={ className ? className : undefined }
			value={ content }
			dir={ direction }
		/>
	);
}
