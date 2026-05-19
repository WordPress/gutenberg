/**
 * WordPress dependencies
 */
import { TextareaControl } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import type { DataFormControlProps, FieldValidity } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import styles from './quick-post-content-field.module.css';

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

export default function QuickPostContentField< Item >( {
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
		<div className={ styles.root }>
			<TextareaControl
				__nextHasNoMarginBottom
				label={ field.label }
				hideLabelFromVision={ hideLabelFromVision }
				value={ value ?? '' }
				placeholder={ field.placeholder }
				help={ help }
				onChange={ onChangeValue }
				disabled={ disabled }
				rows={ 4 }
			/>
		</div>
	);
}
