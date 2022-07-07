/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { RichText, useBlockProps } from '@wordpress/block-editor';

export default function PreformattedEdit( {
	attributes,
	mergeBlocks,
	setAttributes,
	onRemove,
	style,
} ) {
	const { content } = attributes;
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
			onRemove={ onRemove }
			aria-label={ __( 'Preformatted text' ) }
			placeholder={ __( 'Write preformatted text…' ) }
			onMerge={ mergeBlocks }
			{ ...blockProps }
			__unstablePastePlainText
		/>
	);
}
