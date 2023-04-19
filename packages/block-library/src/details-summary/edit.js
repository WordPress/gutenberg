/**
 * WordPress dependencies
 */
import { RichText, useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

function DetailsSummaryEdit( { attributes, setAttributes } ) {
	const summary = attributes.summary ? attributes.summary : __( 'Details' );
	return (
		<summary
			{ ...useBlockProps() }
			onClick={ ( event ) => event.preventDefault() }
		>
			<RichText
				aria-label={ __( 'Add summary' ) }
				allowedFormats={ [] }
				withoutInteractiveFormatting
				value={ summary }
				onChange={ ( newSummary ) =>
					setAttributes( { summary: newSummary } )
				}
			/>
		</summary>
	);
}

export default DetailsSummaryEdit;
