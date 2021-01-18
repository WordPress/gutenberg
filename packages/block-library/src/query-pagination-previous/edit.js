/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useBlockProps, RichText } from '@wordpress/block-editor';

export default function QueryPaginationPreviousEdit( {
	attributes: { label },
	setAttributes,
} ) {
	const placeholder = __( 'Previous Page' );
	return (
		<>
			<div { ...useBlockProps() }>
				{
					<RichText
						tagName="a"
						aria-label={ __( 'Previous page link' ) }
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
