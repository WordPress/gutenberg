/**
 * WordPress dependencies
 */
// @ts-ignore — `@wordpress/rich-text-control` ships no `.d.ts` files, so the
// type-declaration build cannot resolve this import even though the package
// is declared as a dependency.
import { RichTextControl } from '@wordpress/rich-text-control';
import type { DataFormControlProps } from '@wordpress/dataviews';

/**
 * Configuration specific to rich text fields.
 *
 * `DataFormControlProps.config` is typed with a generic shape that does not
 * cover the rich-text specific options, so the runtime value is narrowed to
 * this interface at the consumption site.
 */
interface RichTextFieldConfig {
	clientId?: string;
	className?: string;
	placeholder?: string;
	allowedFormats?: string[];
	disableFormats?: boolean;
	withoutInteractiveFormatting?: boolean;
	preserveWhiteSpace?: boolean;
	disableLineBreaks?: boolean;
}

export default function RichTextEdit< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
	config,
}: DataFormControlProps< Item > ) {
	const richTextConfig = config as RichTextFieldConfig | undefined;
	return (
		<RichTextControl
			label={ field.label }
			value={ field.getValue( { item: data } ) }
			onChange={ ( value: string ) =>
				onChange( field.setValue( { item: data, value } ) )
			}
			placeholder={ richTextConfig?.placeholder }
			id={ field.id }
			clientId={ richTextConfig?.clientId }
			className={ richTextConfig?.className }
			hideLabelFromVision={ hideLabelFromVision }
			allowedFormats={ richTextConfig?.allowedFormats }
			disableFormats={ richTextConfig?.disableFormats }
			withoutInteractiveFormatting={
				richTextConfig?.withoutInteractiveFormatting
			}
			preserveWhiteSpace={ richTextConfig?.preserveWhiteSpace }
			disableLineBreaks={ richTextConfig?.disableLineBreaks }
		/>
	);
}
