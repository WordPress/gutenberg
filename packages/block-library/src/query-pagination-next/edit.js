/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useBlockProps, RichText } from '@wordpress/block-editor';

export default function QueryPaginationNextEdit( {
	attributes: { label },
	setAttributes,
} ) {
	const placeholder = __( 'Next Page' );
	return (
		<>
			<div { ...useBlockProps() }>
				{
					<RichText
						tagName="a"
						aria-label={ __( 'Next page link' ) }
						placeholder={ placeholder }
						value={ label }
						allowedFormats={ [ 'core/bold', 'core/italic' ] }
						onChange={ ( newLabel ) =>
							setAttributes( { label: newLabel } )
						}
					/>
				}
			</div>
		</>
	);
}
