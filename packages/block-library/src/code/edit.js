/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	RichText,
	useBlockProps,
	RichTextShortcut,
} from '@wordpress/block-editor';
import { __unstableIndentCode } from '@wordpress/rich-text';

export default function CodeEdit( {
	attributes,
	setAttributes,
	onRemove,
	onReplace,
} ) {
	const blockProps = useBlockProps();

	const controls = ( { value, onChange } ) => {
		return (
			<>
				<RichTextShortcut
					type="primary"
					character="]"
					onUse={ () => {
						onChange( __unstableIndentCode( value ) );
					} }
				/>
			</>
		);
	};
	return (
		<pre { ...blockProps }>
			<RichText
				tagName="code"
				value={ attributes.content }
				onChange={ ( content ) => setAttributes( { content } ) }
				onReplace={ onReplace }
				onRemove={ onRemove }
				placeholder={ __( 'Write code…' ) }
				aria-label={ __( 'Code' ) }
				preserveWhiteSpace
				__unstablePastePlainText
			>
				{ controls }
			</RichText>
		</pre>
	);
}
