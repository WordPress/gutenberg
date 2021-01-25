/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';
import {
	AlignmentToolbar,
	BlockControls,
	RichText,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

const name = 'core/paragraph';

function ParagraphBlock( {
	attributes,
	mergeBlocks,
	onReplace,
	setAttributes,
	mergedStyle,
	style,
	clientId,
} ) {
	const { isRTL, block } = useSelect( ( select ) => {
		const { getBlock, getSettings } = select( 'core/block-editor' );
		return {
			isRTL: !! getSettings().isRTL,
			block: getBlock( clientId ),
		};
	}, [] );
	const { align, content, placeholder } = attributes;

	const styles = {
		...mergedStyle,
		...style,
	};

	return (
		<>
			<BlockControls>
				<AlignmentToolbar
					value={ align }
					isRTL={ isRTL }
					onChange={ ( nextAlign ) => {
						setAttributes( { align: nextAlign } );
					} }
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
				onSplit={ ( value, keepId ) => {
					if ( keepId ) {
						return {
							...block,
							attributes: {
								...block.attributes,
								content: value || '',
							},
						};
					}
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
		</>
	);
}

export default ParagraphBlock;
