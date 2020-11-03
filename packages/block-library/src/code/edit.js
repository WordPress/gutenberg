/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { RichText, useBlockProps } from '@wordpress/block-editor';

export default function CodeEdit( { attributes, setAttributes } ) {
	const blockProps = useBlockProps();
	return (
		<pre { ...blockProps }>
			<RichText
				tagName="code"
				value={ attributes.content }
				onChange={ ( content ) => setAttributes( { content } ) }
				placeholder={ __( 'Write code…' ) }
				aria-label={ __( 'Code' ) }
				preserveWhiteSpace
			/>
		</pre>
	);
}
