/**
 * External dependencies
 */
import type { Dispatch, SetStateAction } from 'react';

/**
 * WordPress dependencies
 */
import {
	TextControl,
	__experimentalNumberControl as NumberControl,
	SelectControl,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { Form, Field, NormalizedField, FieldType } from '../../types';
import { normalizeFields } from '../../normalize-fields';

type DataFormProps< Item > = {
	data: Item;
	fields: Field< Item >[];
	form: Form;
	onChange: Dispatch< SetStateAction< Item > >;
};

type DataFormControlProps< Item > = {
	data: Item;
	field: NormalizedField< Item >;
	onChange: Dispatch< SetStateAction< Item > >;
};

function DataFormTextControl< Item >( {
	data,
	field,
	onChange,
}: DataFormControlProps< Item > ) {
	const { id, label, placeholder } = field;
	const value = field.getValue( { item: data } );

	const onChangeControl = useCallback(
		( newValue: string ) =>
			onChange( ( prevItem: Item ) => ( {
				...prevItem,
				[ id ]: newValue,
			} ) ),
		[ id, onChange ]
	);

	return (
		<TextControl
			label={ label }
			placeholder={ placeholder }
			value={ value ?? '' }
			onChange={ onChangeControl }
			__next40pxDefaultSize
		/>
	);
}

function DataFormNumberControl< Item >( {
	data,
	field,
	onChange,
}: DataFormControlProps< Item > ) {
	const { id, label, description } = field;
	const value = field.getValue( { item: data } ) ?? '';
	const onChangeControl = useCallback(
		( newValue: string | undefined ) =>
			onChange( ( prevItem: Item ) => ( {
				...prevItem,
				[ id ]: newValue,
			} ) ),
		[ id, onChange ]
	);

	if ( field.elements ) {
		const elements = [
			/*
			 * Value can be undefined when:
			 *
			 * - the field is not required
			 * - in bulk editing
			 *
			 */
			{ label: __( 'Select item' ), value: '' },
			...field.elements,
		];

		return (
			<SelectControl
				label={ label }
				value={ value }
				options={ elements }
				onChange={ onChangeControl }
			/>
		);
	}

	return (
		<NumberControl
			label={ label }
			help={ description }
			value={ value }
			onChange={ onChangeControl }
			__next40pxDefaultSize
		/>
	);
}

const controls: {
	[ key in FieldType ]: < Item >(
		props: DataFormControlProps< Item >
	) => JSX.Element;
} = {
	text: DataFormTextControl,
	integer: DataFormNumberControl,
};

function getControlForField< Item >( field: NormalizedField< Item > ) {
	if ( ! field.type ) {
		return null;
	}

	if ( ! Object.keys( controls ).includes( field.type ) ) {
		return null;
	}

	return controls[ field.type ];
}

export default function DataForm< Item >( {
	data,
	fields,
	form,
	onChange,
}: DataFormProps< Item > ) {
	const visibleFields = useMemo(
		() =>
			normalizeFields(
				fields.filter(
					( { id } ) => !! form.visibleFields?.includes( id )
				)
			),
		[ fields, form.visibleFields ]
	);

	return visibleFields.map( ( field ) => {
		const DataFormControl = getControlForField( field );
		return DataFormControl ? (
			<DataFormControl
				key={ field.id }
				data={ data }
				field={ field }
				onChange={ onChange }
			/>
		) : null;
	} );
}
