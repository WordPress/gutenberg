/**
 * WordPress dependencies
 */
import { TextareaControl } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import type { DataFormControlProps, FieldValidity } from '@wordpress/dataviews';
import { Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import styles from './quick-draft-content-field.module.css';

/*
 * Returns the first failing validity rule's message. Order matches the visual
 * reading order (required, then length, then format, then custom).
 */
function getErrorMessage( validity: FieldValidity | undefined ) {
	if ( ! validity ) {
		return undefined;
	}
	const entries = [
		validity.required,
		validity.minLength,
		validity.maxLength,
		validity.pattern,
		validity.custom,
	];
	const invalid = entries.find( ( entry ) => entry?.type === 'invalid' );
	return invalid?.message;
}

/*
 * Custom DataForm `Edit` that renders a `<textarea>` filling its container
 * vertically, so the field grows with the widget tile. See the module CSS for
 * the API-gap workarounds that complete the flex chain end-to-end.
 */
export default function QuickDraftContentField< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
	validity,
}: DataFormControlProps< Item > ) {
	const value = field.getValue( { item: data } ) as string | undefined;
	const disabled = field.isDisabled( { item: data, field } );

	const onChangeValue = useCallback(
		( newValue: string ) =>
			onChange( field.setValue( { item: data, value: newValue } ) ),
		[ data, field, onChange ]
	);

	const errorMessage = getErrorMessage( validity );
	const help = errorMessage ?? field.description;

	return (
		<Stack direction="column" className={ styles.root }>
			<TextareaControl
				label={ field.label }
				hideLabelFromVision={ hideLabelFromVision }
				value={ value ?? '' }
				placeholder={ field.placeholder }
				help={ help }
				onChange={ onChangeValue }
				disabled={ disabled }
				rows={ 4 }
			/>
		</Stack>
	);
}
