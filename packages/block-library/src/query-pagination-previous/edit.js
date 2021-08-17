/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useBlockProps, PlainText } from '@wordpress/block-editor';

export default function QueryPaginationPreviousEdit( {
	attributes: { label },
	setAttributes,
} ) {
	return (
		<PlainText
			__experimentalVersion={ 2 }
			tagName="a"
			aria-label={ __( 'Previous page link' ) }
			placeholder={ __( 'Previous Page' ) }
			value={ label }
			onChange={ ( newLabel ) => setAttributes( { label: newLabel } ) }
			{ ...useBlockProps() }
		/>
	);
}
