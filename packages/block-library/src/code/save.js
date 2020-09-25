/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';
import { getBlockProps } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { escape } from './utils';

export default function save( { attributes } ) {
	return (
		<pre { ...getBlockProps() }>
			<RichText.Content
				tagName="code"
				value={ escape( attributes.content ) }
			/>
		</pre>
	);
}
