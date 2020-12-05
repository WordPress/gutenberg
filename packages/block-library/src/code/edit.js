/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { RichText, useBlockProps } from '@wordpress/block-editor';
import { Button, Tooltip } from '@wordpress/components';

export default function CodeEdit( { attributes, setAttributes, onRemove } ) {
	const blockProps = useBlockProps();
	return (
		<pre { ...blockProps }>
			<Tooltip text="Enabled button">
				<Button disabled>Enabled</Button>
			</Tooltip>
			<RichText
				tagName="code"
				value={ attributes.content }
				onChange={ ( content ) => setAttributes( { content } ) }
				onRemove={ onRemove }
				placeholder={ __( 'Write code…' ) }
				aria-label={ __( 'Code' ) }
				preserveWhiteSpace
			/>
		</pre>
	);
}
