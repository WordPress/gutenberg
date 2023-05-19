/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	RichText,
	useBlockProps,
	__experimentalTemplateContent as TemplateContent,
} from '@wordpress/block-editor';

function TemplateContentEdit( {
	attributes: { content, name },
	setAttributes,
} ) {
	const blockProps = useBlockProps();

	return (
		<>
			<RichText
				{ ...blockProps }
				identifier="content"
				tagName={ 'div' }
				value={ content }
				onChange={ ( newContent ) =>
					setAttributes( { content: newContent } )
				}
				aria-label={ __( 'Template content' ) }
				placeholder={ __( 'Template content' ) }
			/>
			<TemplateContent name={ name }>Foo!</TemplateContent>
		</>
	);
}

export default TemplateContentEdit;
