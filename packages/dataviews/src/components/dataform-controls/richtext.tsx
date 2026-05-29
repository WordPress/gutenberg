/**
 * WordPress dependencies
 */
// @ts-ignore — `@wordpress/rich-text-control` ships no `.d.ts` files, so the
// type-declaration build cannot resolve this import even though the package
// is declared as a dependency.
import { RichTextControl } from '@wordpress/rich-text-control';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { DataFormControlProps } from '../../types';

/**
 * Configuration specific to the rich text control.
 *
 * `DataFormControlProps.config` is typed with a generic shape that does not
 * cover the rich-text specific options, so the runtime value is narrowed to
 * this interface at the consumption site.
 */
interface RichTextControlConfig {
	className?: string;
	clientId?: string;
	allowedFormats?: string[];
	disableFormats?: boolean;
	withoutInteractiveFormatting?: boolean;
	preserveWhiteSpace?: boolean;
	disableLineBreaks?: boolean;
}

export default function RichText< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
	config,
}: DataFormControlProps< Item > ) {
	const richTextConfig = ( config || {} ) as RichTextControlConfig;
	const { label, placeholder, id, setValue } = field;
	const value = field.getValue( { item: data } );

	const onChangeControl = useCallback(
		( newValue: string ) =>
			onChange( setValue( { item: data, value: newValue } ) ),
		[ data, onChange, setValue ]
	);

	return (
		<RichTextControl
			label={ label }
			value={ value }
			onChange={ onChangeControl }
			placeholder={ placeholder }
			id={ id }
			hideLabelFromVision={ hideLabelFromVision }
			className={ richTextConfig.className }
			clientId={ richTextConfig.clientId }
			allowedFormats={ richTextConfig.allowedFormats }
			disableFormats={ richTextConfig.disableFormats }
			withoutInteractiveFormatting={
				richTextConfig.withoutInteractiveFormatting
			}
			preserveWhiteSpace={ richTextConfig.preserveWhiteSpace }
			disableLineBreaks={ richTextConfig.disableLineBreaks }
		/>
	);
}
