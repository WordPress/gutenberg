/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useBlockProps, RichText } from '@wordpress/block-editor';

export default function QueryPaginationNextEdit( {
	attributes: { label },
	setAttributes,
} ) {
	return (
		<RichText
			tagName="a"
			aria-label={ __( 'Next page link' ) }
			placeholder={ __( 'Next Page' ) }
			value={ label }
			withoutInteractiveFormatting
			keepPlaceholderOnFocus
			onChange={ ( newLabel ) => setAttributes( { label: newLabel } ) }
			{ ...useBlockProps() }
		/>
	);
}
