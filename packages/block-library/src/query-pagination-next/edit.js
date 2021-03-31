/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useBlockProps, PlainText } from '@wordpress/block-editor';

export default function QueryPaginationNextEdit( {
	attributes: { label },
	setAttributes,
} ) {
	return (
		<PlainText
			__experimentalVersion={ 2 }
			tagName="a"
			aria-label={ __( 'Next page link' ) }
			placeholder={ __( 'Next Page' ) }
			value={ label }
			onChange={ ( newLabel ) => setAttributes( { label: newLabel } ) }
			{ ...useBlockProps() }
		/>
	);
}
