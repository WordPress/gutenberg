/**
 * WordPress dependencies
 */
// @ts-expect-error block-editor is not typed correctly.
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import type {
	DataFormControlProps,
	NormalizedField,
} from '@wordpress/dataviews';

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
	placeholder?: string;
	allowedFormats?: string[];
	disableFormats?: boolean;
	withoutInteractiveFormatting?: boolean;
	preserveWhiteSpace?: boolean;
	disableLineBreaks?: boolean;
}

/**
 * Extended field type that includes the config property.
 */
interface RichTextField< Item > extends NormalizedField< Item > {
	config?: RichTextFieldConfig;
}

interface RichTextEditProps< Item >
	extends Omit< DataFormControlProps< Item >, 'field' > {
	field: RichTextField< Item >;
}

export default function RichTextEdit< Item >( {
	data,
	field,
	hideLabelFromVision,
	onChange,
	config,
}: RichTextEditProps< Item > ) {
	const fieldConfig = field.config || {};
	// TODO: clientId is passed via config but isn't part of the standard DataFormControlProps config type.
	const clientId = ( config as any )?.clientId;

	return (
		<RichTextControl
			label={ field.label }
			value={ field.getValue( { item: data } ) }
			onChange={ ( value: string ) =>
				onChange( field.setValue( { item: data, value } ) )
			}
			placeholder={ fieldConfig?.placeholder }
			id={ field.id }
			clientId={ clientId }
			hideLabelFromVision={ hideLabelFromVision }
			allowedFormats={ fieldConfig?.allowedFormats }
			disableFormats={ fieldConfig?.disableFormats }
			withoutInteractiveFormatting={
				fieldConfig?.withoutInteractiveFormatting
			}
			preserveWhiteSpace={ fieldConfig?.preserveWhiteSpace }
			disableLineBreaks={ fieldConfig?.disableLineBreaks }
		/>
	);
}
