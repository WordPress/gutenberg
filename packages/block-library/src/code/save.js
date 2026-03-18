/**
 * WordPress dependencies
 */
import { RichText, useBlockProps } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { escape } from './utils';

export default function save( { attributes } ) {
	const { content, language } = attributes;
	const codeClassName = language ? `language-${ language }` : undefined;

	return (
		<pre { ...useBlockProps.save() }>
			<RichText.Content
				tagName="code"
				className={ codeClassName }
				// To do: `escape` encodes characters in shortcodes and URLs to
				// prevent embedding in PHP. Ideally checks for the code block,
				// or pre/code tags, should be made on the PHP side?
				value={ escape(
					typeof content === 'string'
						? content
						: content.toHTMLString( {
								preserveWhiteSpace: true,
						  } )
				) }
			/>
		</pre>
	);
}
