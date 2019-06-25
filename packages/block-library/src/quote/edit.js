/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { AlignmentToolbar, BlockControls, RichText } from '@wordpress/block-editor';
import { BlockQuotation } from '@wordpress/components';

export default function QuoteEdit( { attributes, setAttributes, isSelected, mergeBlocks, onReplace, className } ) {
	const { align, value, citation } = attributes;
	return (
		<>
			<BlockControls>
				<AlignmentToolbar
					value={ align }
					onChange={ ( nextAlign ) => {
						setAttributes( { align: nextAlign } );
					} }
				/>
			</BlockControls>
			<BlockQuotation className={ className } style={ { textAlign: align } }>
				<RichText
					identifier="value"
					multiline
					value={ value }
					onChange={
						( nextValue ) => setAttributes( {
							value: nextValue,
						} )
					}
					onMerge={ mergeBlocks }
					onRemove={ ( forward ) => {
						const hasEmptyCitation = ! citation || citation.length === 0;
						if ( ! forward && hasEmptyCitation ) {
							onReplace( [] );
						}
					} }
					placeholder={
						// translators: placeholder text used for the quote
						__( 'Write quote…' )
					}
				/>
				{ ( ! RichText.isEmpty( citation ) || isSelected ) && (
					<RichText
						identifier="citation"
						value={ citation }
						onChange={
							( nextCitation ) => setAttributes( {
								citation: nextCitation,
							} )
						}
						__unstableMobileNoFocusOnMount
						placeholder={
							// translators: placeholder text used for the citation
							__( 'Write citation…' )
						}
						className="wp-block-quote__citation"
					/>
				) }
			</BlockQuotation>
		</>
	);
}
