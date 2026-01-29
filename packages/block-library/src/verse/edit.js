/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { RichText, useBlockProps } from '@wordpress/block-editor';
import { createBlock, getDefaultBlockName } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import useDeprecatedTextAlign from '../utils/deprecated-text-align-attributes';

export default function VerseEdit( props ) {
	const {
		attributes,
		setAttributes,
		mergeBlocks,
		onRemove,
		insertBlocksAfter,
		style,
	} = props;
	const { content } = attributes;
	useDeprecatedTextAlign( props );
	const blockProps = useBlockProps( { style } );

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
			aria-label={ __( 'Verse text' ) }
			placeholder={ __( 'Write verse…' ) }
			onRemove={ onRemove }
			onMerge={ mergeBlocks }
			{ ...blockProps }
			__unstablePastePlainText
			__unstableOnSplitAtDoubleLineEnd={ () =>
				insertBlocksAfter( createBlock( getDefaultBlockName() ) )
			}
		/>
	);
}
