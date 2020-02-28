/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';
import {
	AlignmentToolbar,
	BlockControls,
	RichText,
	__experimentalUseColors,
} from '@wordpress/block-editor';

const name = 'core/paragraph';

function ParagraphBlock( {
	attributes,
	mergeBlocks,
	onReplace,
	setAttributes,
	style,
} ) {
	const { align, content, placeholder } = attributes;

	/* eslint-disable @wordpress/no-unused-vars-before-return */
	const { TextColor } = __experimentalUseColors( [
		{ name: 'textColor', property: 'color' },
	] );
	/* eslint-enable @wordpress/no-unused-vars-before-return */

	return (
		<>
			<BlockControls>
				<AlignmentToolbar
					isCollapsed={ false }
					value={ align }
					onChange={ ( nextAlign ) => {
						setAttributes( { align: nextAlign } );
					} }
				/>
			</BlockControls>
			<TextColor>
				<RichText
					identifier="content"
					tagName="p"
					value={ content }
					deleteEnter={ true }
					style={ style }
					onChange={ ( nextContent ) => {
						setAttributes( {
							content: nextContent,
						} );
					} }
					onSplit={ ( value ) => {
						if ( ! value ) {
							return createBlock( name );
						}

						return createBlock( name, {
							...attributes,
							content: value,
						} );
					} }
					onMerge={ mergeBlocks }
					onReplace={ onReplace }
					onRemove={ onReplace ? () => onReplace( [] ) : undefined }
					placeholder={ placeholder || __( 'Start writing…' ) }
					textAlign={ align }
				/>
			</TextColor>
		</>
	);
}

export default ParagraphBlock;
