/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { escape } from './utils';

export default function save( { attributes } ) {
	return (
		<pre>
			<RichText.Content
				tagName="code"
				value={ escape( attributes.content ) }
			/>
		</pre>
	);
}
