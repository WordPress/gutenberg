/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { RichText } from '@wordpress/block-editor';

export default function PreformattedEdit( { attributes, mergeBlocks, setAttributes, className } ) {
	const { content } = attributes;

	return (
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
			placeholder={ __( 'Write preformatted text…' ) }
			wrapperClassName={ className }
			onMerge={ mergeBlocks }
		/>
	);
}
