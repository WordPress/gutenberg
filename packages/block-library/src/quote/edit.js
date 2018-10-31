/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';
import {
	BlockControls,
	AlignmentToolbar,
	RichText,
} from '@wordpress/editor';

export default function edit( { attributes, setAttributes, isSelected, mergeBlocks, onReplace, className } ) {
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
					/* translators: the text of the quotation */
					placeholder={ __( 'Write quote…' ) }
				/>
				{ ( ! RichText.isEmpty( citation ) || isSelected ) && (
					<RichText
						value={ citation }
						onChange={
							( nextCitation ) => setAttributes( {
								citation: nextCitation,
							} )
						}
						/* translators: the individual or entity quoted */
						placeholder={ __( 'Write citation…' ) }
						className="wp-block-quote__citation"
					/>
				) }
			</blockquote>
		</Fragment>
	);
}
