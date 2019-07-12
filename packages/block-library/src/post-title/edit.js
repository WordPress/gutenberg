/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { cleanForSlug } from '@wordpress/editor';
import { RichText } from '@wordpress/block-editor';

export default function PostTitleEdit( {
	attributes: { title },
	setAttributes,
} ) {
	return (
		<RichText
			value={ title }
			onChange={ ( value ) => setAttributes( { title: value, slug: cleanForSlug( value ) } ) }
			tagName="h1"
			placeholder={ __( 'Title' ) }
			formattingControls={ [] }
		/>
	);
}
