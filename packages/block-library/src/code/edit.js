/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	RichText,
	useBlockProps,
	InspectorControls,
} from '@wordpress/block-editor';
import { createBlock, getDefaultBlockName } from '@wordpress/blocks';
import { TextControl, PanelBody } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { sanitizeLanguage, toHTMLStr, parseFencedCode } from './utils';

export default function CodeEdit( {
	attributes,
	setAttributes,
	onRemove,
	insertBlocksAfter,
	mergeBlocks,
} ) {
	const { content, language } = attributes;
	const blockProps = useBlockProps();
	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Code Language' ) }>
					<TextControl
						label={ __( 'Language' ) }
						value={ language || '' }
						onChange={ ( value ) => {
							const nextLanguage = sanitizeLanguage( value );
							if ( nextLanguage === ( language || '' ) ) {
								return;
							}
							setAttributes( {
								language: nextLanguage,
							} );
						} }
						help={ __(
							'Enter a language slug, e.g., php, javascript, python.'
						) }
						autoComplete="off"
					/>
				</PanelBody>
			</InspectorControls>
			<pre { ...blockProps }>
				<RichText
					tagName="code"
					identifier="content"
					value={ content }
					onChange={ ( newContent ) => {
						const parsedFencedCode = parseFencedCode( newContent );

						if ( parsedFencedCode ) {
							// Compare against the string form of current content
							// since parsedContent is always a plain string.
							if (
								parsedFencedCode.content ===
									toHTMLStr( content ) &&
								parsedFencedCode.language === ( language || '' )
							) {
								return;
							}

							setAttributes( parsedFencedCode );
							return;
						}

						setAttributes( { content: newContent } );
					} }
					onRemove={ onRemove }
					onMerge={ mergeBlocks }
					placeholder={ __( 'Write code…' ) }
					aria-label={ __( 'Code' ) }
					preserveWhiteSpace
					__unstablePastePlainText
					__unstableOnSplitAtDoubleLineEnd={ () =>
						insertBlocksAfter(
							createBlock( getDefaultBlockName() )
						)
					}
					style={ { whiteSpace: 'break-spaces' } }
				/>
			</pre>
		</>
	);
}
