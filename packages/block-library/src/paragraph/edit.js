/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { RichText, useBlockProps } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { useOnEnter } from './use-enter';
import Controls, { hasDropCapDisabled } from './controls';
import { name } from './';

function ParagraphBlock( {
	attributes,
	mergeBlocks,
	onReplace,
	onRemove,
	setAttributes,
	clientId,
} ) {
	const { align, content, direction, dropCap, placeholder } = attributes;
	const blockProps = useBlockProps( {
		ref: useOnEnter( { clientId, content } ),
		className: classnames( {
			'has-drop-cap': hasDropCapDisabled( align ) ? false : dropCap,
			[ `has-text-align-${ align }` ]: align,
		} ),
		style: { direction },
	} );

	return (
		<>
			<Controls
				align={ align }
				direction={ direction }
				dropCap={ dropCap }
				clientId={ clientId }
				setAttributes={ setAttributes }
			/>
			<RichText
				identifier="content"
				tagName="p"
				{ ...blockProps }
				value={ content }
				onChange={ ( newContent ) =>
					setAttributes( { content: newContent } )
				}
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
				onRemove={ onRemove }
				aria-label={
					RichText.isEmpty( content )
						? __(
								'Empty block; start writing or type forward slash to choose a block'
						  )
						: __( 'Block: Paragraph' )
				}
				data-empty={ RichText.isEmpty( content ) }
				placeholder={ placeholder || __( 'Type / to choose a block' ) }
				data-custom-placeholder={ placeholder ? true : undefined }
				__unstableEmbedURLOnPaste
				__unstableAllowPrefixTransformations
			/>
		</>
	);
}

export default ParagraphBlock;
