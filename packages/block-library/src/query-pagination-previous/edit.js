/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useBlockProps, RichText } from '@wordpress/block-editor';

export default function QueryPaginationPreviousEdit( {
	attributes: { label },
	setAttributes,
} ) {
	return (
		<RichText
			tagName="a"
			aria-label={ __( 'Previous page link' ) }
			placeholder={ __( 'Previous Page' ) }
			value={ label }
			withoutInteractiveFormatting
			keepPlaceholderOnFocus
			onChange={ ( newLabel ) => setAttributes( { label: newLabel } ) }
			{ ...useBlockProps() }
		/>
	);
}
