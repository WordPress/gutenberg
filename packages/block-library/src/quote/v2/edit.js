/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	BlockControls,
	RichText,
	useBlockProps,
	useInnerBlocksProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import {
	BlockQuotation,
	ToolbarGroup,
	ToolbarButton,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { createBlock } from '@wordpress/blocks';

const TEMPLATE = [ [ 'core/paragraph', {} ] ];

export default function QuoteEdit( {
	attributes: { attribution },
	setAttributes,
	isSelected,
	insertBlocksAfter,
	clientId,
} ) {
	const isAncestorOfSelectedBlock = useSelect( ( select ) =>
		select( blockEditorStore ).hasSelectedInnerBlock( clientId )
	);
	const hasAttribution = attribution !== null;
	const isEditingQuote = isSelected || isAncestorOfSelectedBlock;
	const showAttribution =
		( isEditingQuote && hasAttribution ) ||
		! RichText.isEmpty( attribution );

	const blockProps = useBlockProps();
	const innerBlocksProps = useInnerBlocksProps(
		showAttribution ? blockProps : {},
		{
			template: TEMPLATE,
			templateInsertUpdatesSelection: true,
		}
	);

	return (
		<>
			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton
						isActive={ hasAttribution }
						label={ __( 'Toggle attribution visibility' ) }
						onClick={ () =>
							setAttributes( {
								attribution: hasAttribution ? null : '',
							} )
						}
					>
						{ __( 'Add attribution' ) }
					</ToolbarButton>
				</ToolbarGroup>
			</BlockControls>
			{ showAttribution ? (
				<figure { ...blockProps }>
					<BlockQuotation { ...innerBlocksProps } />
					<RichText
						identifier="attribution"
						tagName={ 'figcaption' }
						style={ { display: 'block' } }
						value={ attribution ?? '' }
						onChange={ ( nextAttribution ) => {
							setAttributes( { attribution: nextAttribution } );
						} }
						__unstableMobileNoFocusOnMount
						aria-label={ __( 'Quote attribution' ) }
						placeholder={
							// translators: placeholder text used for the attribution
							__( 'Add attribution' )
						}
						className="wp-block-quote__attribution"
						__unstableOnSplitAtEnd={ () =>
							insertBlocksAfter( createBlock( 'core/paragraph' ) )
						}
					/>
				</figure>
			) : (
				<BlockQuotation { ...innerBlocksProps } />
			) }
		</>
	);
}
