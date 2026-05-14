/**
 * WordPress dependencies
 */
// @ts-expect-error block-editor is not typed correctly.
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import type { DataFormControlProps } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { RichTextControl } = unlock( blockEditorPrivateApis );

/**
 * Configuration specific to rich text fields.
 * TODO: The Field<Item> type doesn't include a 'config' property in its definition,
 * but it's used in practice. This should ideally be added to the upstream Field type.
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
	autocompleters?: unknown[];
}

interface RichTextEditProps< Item >
	extends Pick<
		DataFormControlProps< Item >,
		'data' | 'field' | 'onChange' | 'hideLabelFromVision'
	> {
	config?: RichTextFieldConfig;
}

export default function RichTextEdit< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
	config,
}: RichTextEditProps< Item > ) {
	return (
		<RichTextControl
			label={ field.label }
			value={ field.getValue( { item: data } ) }
			onChange={ ( value: string ) =>
				onChange( field.setValue( { item: data, value } ) )
			}
			placeholder={ config?.placeholder }
			id={ field.id }
			clientId={ config?.clientId }
			className={ config?.className }
			hideLabelFromVision={ hideLabelFromVision }
			allowedFormats={ config?.allowedFormats }
			disableFormats={ config?.disableFormats }
			withoutInteractiveFormatting={
				config?.withoutInteractiveFormatting
			}
			preserveWhiteSpace={ config?.preserveWhiteSpace }
			disableLineBreaks={ config?.disableLineBreaks }
			autocompleters={ config?.autocompleters }
		/>
	);
}
