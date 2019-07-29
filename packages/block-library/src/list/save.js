/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { ordered, textAlign, values } = attributes;
	const tagName = ordered ? 'ol' : 'ul';
	const className = classnames( {
		[ `has-text-align-${ textAlign }` ]: textAlign,
	} );

	return (
		<RichText.Content
			tagName={ tagName }
			className={ className }
			value={ values }
			multiline="li"
		/>
	);
}
