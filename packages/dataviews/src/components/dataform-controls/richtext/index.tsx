/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import RichTextControl from './control';
import type { DataFormControlProps } from '../../../types';
import getCustomValidity from '../utils/get-custom-validity';

export default function RichText< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
	markWhenOptional,
	config,
	validity,
}: DataFormControlProps< Item > ) {
	const {
		className,
		clientId,
		allowedFormats,
		disableFormats,
		withoutInteractiveFormatting,
		preserveWhiteSpace,
		disableLineBreaks,
	} = config || {};
	const disabled = field.isDisabled( { item: data, field } );
	const { label, placeholder, description, id, setValue, isValid } = field;
	/*
	 * DataForm fields commonly represent empty values as `null`/`undefined`.
	 * `useRichText` only defaults `undefined` (and with `null` it can report
	 * changes as `RichTextData` rather than an HTML string), so normalize to
	 * an empty string at the DataForm boundary like the sibling text controls.
	 */
	const value = field.getValue( { item: data } ) ?? '';

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
			help={ description }
			disabled={ disabled }
			required={ !! isValid.required }
			markWhenOptional={ markWhenOptional }
			customValidity={ getCustomValidity( isValid, validity ) }
			className={ className }
			clientId={ clientId }
			allowedFormats={ allowedFormats }
			disableFormats={ disableFormats }
			withoutInteractiveFormatting={ withoutInteractiveFormatting }
			preserveWhiteSpace={ preserveWhiteSpace }
			disableLineBreaks={ disableLineBreaks }
		/>
	);
}
