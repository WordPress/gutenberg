/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';
import {
	AlignmentControl,
	BlockControls,
	RichText,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useCallback } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

const name = 'core/paragraph';

function ParagraphBlock( {
	attributes,
	mergeBlocks,
	onReplace,
	setAttributes,
	style,
	clientId,
} ) {
	const isRTL = useSelect( ( select ) => {
		return !! select( blockEditorStore ).getSettings().isRTL;
	}, [] );

	const { align, content, placeholder } = attributes;

	const styles = {
		...( style?.baseColors && {
			color: style.baseColors?.color?.text,
			placeholderColor: style.color || style.baseColors?.color?.text,
			linkColor: style.baseColors?.elements?.link?.color?.text,
		} ),
		...style,
	};

	const onAlignmentChange = useCallback( ( nextAlign ) => {
		setAttributes( { align: nextAlign } );
	}, [] );
	return (
		<>
			<BlockControls group="block">
				<AlignmentControl
					value={ align }
					isRTL={ isRTL }
					onChange={ onAlignmentChange }
				/>
			</BlockControls>
			<RichText
				identifier="content"
				tagName="p"
				value={ content }
				deleteEnter={ true }
				style={ styles }
				onChange={ ( nextContent ) => {
					setAttributes( {
						content: nextContent,
					} );
				} }
				onSplit={ ( value, isOriginal ) => {
					let newAttributes;

					if ( isOriginal || value ) {
						newAttributes = {
							...attributes,
							content: value,
						};
					}

					const block = createBlock( name, newAttributes );

					if ( isOriginal ) {
						block.clientId = clientId;
					}

					return block;
				} }
				onMerge={ mergeBlocks }
				onReplace={ onReplace }
				onRemove={ onReplace ? () => onReplace( [] ) : undefined }
				placeholder={ placeholder || __( 'Start writing…' ) }
				textAlign={ align }
				__unstableEmbedURLOnPaste
			/>
		</>
	);
}

export default ParagraphBlock;
