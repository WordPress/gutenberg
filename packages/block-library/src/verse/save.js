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
