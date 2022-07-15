/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	RichText,
	BlockControls,
	AlignmentToolbar,
	store as blockEditorStore,
	useBlockProps,
} from '@wordpress/block-editor';
import { useDispatch } from '@wordpress/data';

export default function VerseEdit( {
	attributes,
	clientId,
	setAttributes,
	mergeBlocks,
	onRemove,
	style,
} ) {
	const { textAlign, content } = attributes;
	const blockProps = useBlockProps( {
		className: classnames( {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} ),
		style,
	} );
	const { insertBeforeBlock } = useDispatch( blockEditorStore );

	return (
		<>
			<BlockControls>
				<AlignmentToolbar
					value={ textAlign }
					onChange={ ( nextAlign ) => {
						setAttributes( { textAlign: nextAlign } );
					} }
				/>
			</BlockControls>
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
				aria-label={ __( 'Verse text' ) }
				placeholder={ __( 'Write verse…' ) }
				onRemove={ onRemove }
				onMerge={ mergeBlocks }
				__unstableOnSplitAtStart={ () => {
					insertBeforeBlock( clientId );
				} }
				textAlign={ textAlign }
				{ ...blockProps }
				__unstablePastePlainText
			/>
		</>
	);
}
