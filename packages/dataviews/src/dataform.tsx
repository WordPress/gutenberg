/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { TextControl } from '@wordpress/components';
import { useCallback, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { Form, Field, NormalizedField } from './types';
import { normalizeFields } from './normalize-fields';

type DataFormProps< Item > = {
	data: Item;
	fields: Field< Item >[];
	form: Form;
	onUpdate: any; // TODO: fix this type.
};

type DataFormControlProps< Item > = {
	data: Item;
	field: NormalizedField< Item >;
	onUpdate: any; // TODO: fix this type.
};

function DataFormTextControl< Item >( {
	data,
	field,
	onUpdate,
}: DataFormControlProps< Item > ) {
	const { id, header, placeholder } = field;
	const value = field.getValue( { item: data } );

	const onChange = useCallback(
		( newValue: string ) =>
			onUpdate( ( prevItem: any ) => ( {
				...prevItem,
				[ id ]: newValue,
			} ) ),
		[ id, onUpdate ]
	);

	return (
		<TextControl
			label={ header }
			placeholder={ placeholder }
			value={ value }
			onChange={ onChange }
		/>
	);
}

const controls: {
	[ key: string ]: < Item >(
		props: DataFormControlProps< Item >
	) => JSX.Element;
} = {
	text: DataFormTextControl,
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
	onUpdate,
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
				onUpdate={ onUpdate }
			/>
		) : null;
	} );
}
