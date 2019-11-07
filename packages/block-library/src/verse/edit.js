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
} from '@wordpress/block-editor';

export default function VerseEdit( { attributes, setAttributes, className, mergeBlocks } ) {
	const { textAlign, content } = attributes;

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
				// Ensure line breaks are normalised to HTML.
				value={ content.replace( /\n/g, '<br>' ) }
				onChange={ ( nextContent ) => {
					setAttributes( {
						// Ensure line breaks are normalised to characters. This
						// saves space, is easier to read, and ensures display
						// filters work correctly.
						content: nextContent.replace( /<br ?\/?>/g, '\n' ),
					} );
				} }
				placeholder={ __( 'Write…' ) }
				className={ classnames( className, {
					[ `has-text-align-${ textAlign }` ]: textAlign,
				} ) }
				onMerge={ mergeBlocks }
			/>
		</>
	);
}
