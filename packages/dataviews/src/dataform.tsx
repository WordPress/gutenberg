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

type DataFormTextControlProps< Item > = {
	data: Item;
	field: NormalizedField< Item >;
	onUpdate: any; // TODO: fix this type.
};

function DataFormTextControl< Item >( {
	data,
	field,
	onUpdate,
}: DataFormTextControlProps< Item > ) {
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
		if ( field.type === 'text' ) {
			return (
				<DataFormTextControl
					data={ data }
					field={ field }
					onUpdate={ onUpdate }
				/>
			);
		}
		return null;
	} );
}
