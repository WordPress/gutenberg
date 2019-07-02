/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';

export default function PostTitleEdit( {
	attributes: { title },
	setAttributes,
} ) {
	return (
		<RichText
			value={ title }
			onChange={ ( value ) => setAttributes( { title: value } ) }
			tagName="h1"
			placeholder={ __( 'Title' ) }
			formattingControls={ [] }
		/>
	);
}
