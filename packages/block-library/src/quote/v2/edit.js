/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	RichText,
	useBlockProps,
	useInnerBlocksProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { BlockQuotation } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { createBlock } from '@wordpress/blocks';
import { Platform } from '@wordpress/element';

const isWebPlatform = Platform.OS === 'web';
const TEMPLATE = [ [ 'core/paragraph', {} ] ];

export default function QuoteEdit( {
	attributes: { citation },
	setAttributes,
	isSelected,
	insertBlocksAfter,
	clientId,
} ) {
	const isAncestorOfSelectedBlock = useSelect( ( select ) =>
		select( blockEditorStore ).hasSelectedInnerBlock( clientId )
	);
	const hasSelection = isSelected || isAncestorOfSelectedBlock;
	const blockProps = useBlockProps();
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		template: TEMPLATE,
		templateInsertUpdatesSelection: true,
	} );

	return (
		<>
			<BlockQuotation { ...innerBlocksProps }>
				{ innerBlocksProps.children }
				{ ( ! RichText.isEmpty( citation ) || hasSelection ) && (
					<RichText
						identifier="citation"
						tagName={ isWebPlatform ? 'cite' : undefined }
						style={ { display: 'block' } }
						value={ citation }
						onChange={ ( nextCitation ) => {
							setAttributes( {
								citation: nextCitation,
							} );
						} }
						__unstableMobileNoFocusOnMount
						aria-label={ __( 'Quote citation' ) }
						placeholder={
							// translators: placeholder text used for the
							// citation
							__( 'Add citation' )
						}
						className="wp-block-quote__citation"
						__unstableOnSplitAtEnd={ () =>
							insertBlocksAfter( createBlock( 'core/paragraph' ) )
						}
					/>
				) }
			</BlockQuotation>
		</>
	);
}
