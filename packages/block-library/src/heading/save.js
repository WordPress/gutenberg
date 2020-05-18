/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { align, content, level } = attributes;
	const tagName = 'h' + level;

	const className = classnames( {
		[ `has-text-align-${ align }` ]: align,
	} );

	return (
		<RichText.Content
			className={ className ? className : undefined }
			tagName={ tagName }
			value={ content }
		/>
	);
}
