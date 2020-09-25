/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';

export default function save( { attributes, getBlockProps } ) {
	const { content } = attributes;

	return (
		<pre { ...getBlockProps() }>
			<RichText.Content value={ content } />
		</pre>
	);
}
