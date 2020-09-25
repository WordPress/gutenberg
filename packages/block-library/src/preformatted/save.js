/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';
import { getBlockProps } from '@wordpress/blocks';

export default function save( { attributes } ) {
	const { content } = attributes;

	return (
		<pre { ...getBlockProps() }>
			<RichText.Content value={ content } />
		</pre>
	);
}
