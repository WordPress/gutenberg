import { RichText, useBlockProps } from '@wordpress/block-editor';
import { escapeIsolatedUrlProtocol } from '../utils/escape-isolated-url-protocol';

export default function save( { attributes } ) {
	const { content } = attributes;

	// A URL on its own line inside a `<pre>` is plain text, but
	// `WP_Embed::autoembed()` would otherwise turn it into an oEmbed card
	// when the whole post content is rendered. See `escapeIsolatedUrlProtocol`.
	const value = escapeIsolatedUrlProtocol(
		typeof content === 'string'
			? content
			: content.toHTMLString( { preserveWhiteSpace: true } )
	);

	return (
		<pre { ...useBlockProps.save() }>
			<RichText.Content value={ value } />
		</pre>
	);
}
