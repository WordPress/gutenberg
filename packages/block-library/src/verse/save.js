/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';

export default function save( { attributes, getBlockProps } ) {
	const { textAlign, content } = attributes;

	const className = classnames( {
		[ `has-text-align-${ textAlign }` ]: textAlign,
	} );

	return (
		<pre { ...getBlockProps( { className } ) }>
			<RichText.Content value={ content } />
		</pre>
	);
}
