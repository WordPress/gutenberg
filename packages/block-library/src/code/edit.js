/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	store as blockEditorStore,
	RichText,
	useBlockProps,
} from '@wordpress/block-editor';
import { useDispatch } from '@wordpress/data';

export default function CodeEdit( {
	attributes,
	clientId,
	setAttributes,
	onRemove,
} ) {
	const blockProps = useBlockProps();
	const { insertBeforeBlock } = useDispatch( blockEditorStore );

	return (
		<pre { ...blockProps }>
			<RichText
				tagName="code"
				value={ attributes.content }
				onChange={ ( content ) => setAttributes( { content } ) }
				onRemove={ onRemove }
				placeholder={ __( 'Write code…' ) }
				aria-label={ __( 'Code' ) }
				preserveWhiteSpace
				__unstableOnSplitAtStart={ () => {
					insertBeforeBlock( clientId );
				} }
				__unstablePastePlainText
			/>
		</pre>
	);
}
