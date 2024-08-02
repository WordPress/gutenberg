/**
 * External dependencies
 */
import type { Dispatch, SetStateAction } from 'react';

/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { normalizeFields } from '../../normalize-fields';
import type { Field, Form } from '../../types';

type DataFormProps< Item > = {
	data: Item;
	fields: Field< Item >[];
	form: Form;
	onChange: Dispatch< SetStateAction< Item > >;
};

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
		return (
			<field.Edit
				key={ field.id }
				data={ data }
				field={ field }
				onChange={ onChange }
			/>
		);
	} );
}
