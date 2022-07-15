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

export default function PreformattedEdit( {
	attributes,
	clientId,
	mergeBlocks,
	setAttributes,
	onRemove,
	style,
} ) {
	const { content } = attributes;
	const blockProps = useBlockProps( { style } );
	const { insertBeforeBlock } = useDispatch( blockEditorStore );

	return (
		<RichText
			tagName="pre"
			identifier="content"
			preserveWhiteSpace
			value={ content }
			onChange={ ( nextContent ) => {
				setAttributes( {
					content: nextContent,
				} );
			} }
			onRemove={ onRemove }
			aria-label={ __( 'Preformatted text' ) }
			placeholder={ __( 'Write preformatted text…' ) }
			onMerge={ mergeBlocks }
			__unstableOnSplitAtStart={ () => {
				insertBeforeBlock( clientId );
			} }
			{ ...blockProps }
			__unstablePastePlainText
		/>
	);
}
