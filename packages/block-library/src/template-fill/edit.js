/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { RichText, useBlockProps } from '@wordpress/block-editor';

function TemplateFillBlock( { attributes: { content }, setAttributes } ) {
	const blockProps = useBlockProps();

	return (
		<RichText
			{ ...blockProps }
			identifier="content"
			tagName={ 'div' }
			value={ content }
			onChange={ ( newContent ) =>
				setAttributes( { content: newContent } )
			}
			aria-label={ __( 'Heading text' ) }
			placeholder={ __( 'Content' ) }
		/>
	);
}

export default TemplateFillBlock;
