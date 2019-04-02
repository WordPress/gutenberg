/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';
import {
	BlockControls,
	AlignmentToolbar,
	RichText,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { ATTRIBUTE_QUOTE, ATTRIBUTE_CITATION } from './contants';

export default function QuoteEdit( { attributes, setAttributes, isSelected, mergeBlocks, onReplace, className } ) {
	const { align, value, citation } = attributes;
	return (
		<Fragment>
			<BlockControls>
				<AlignmentToolbar
					value={ align }
					onChange={ ( nextAlign ) => {
						setAttributes( { align: nextAlign } );
					} }
				/>
			</BlockControls>
			<blockquote className={ className } style={ { textAlign: align } }>
				<RichText
					identifier={ ATTRIBUTE_QUOTE }
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
						identifier={ ATTRIBUTE_CITATION }
						value={ citation }
						onChange={
							( nextCitation ) => setAttributes( {
								citation: nextCitation,
							} )
						}
						placeholder={
							// translators: placeholder text used for the citation
							__( 'Write citation…' )
						}
						className="wp-block-quote__citation"
					/>
				) }
			</blockquote>
		</Fragment>
	);
}
