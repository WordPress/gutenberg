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

export default function RichText< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
	config,
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
