/**
 * WordPress dependencies
 */
import { __experimentalVStack as VStack } from '@wordpress/components';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { normalizeFields } from '../../normalize-fields';
import DataFormFieldVisibility from '../../components/dataform-field-visibility';
import type { DataFormProps, Field } from '../../types';

export default function FormRegular< Item >( {
	data,
	fields,
	form,
	onChange,
}: DataFormProps< Item > ) {
	const visibleFields = useMemo(
		() =>
			normalizeFields(
				( form.fields ?? [] )
					.map( ( fieldId ) =>
						fields.find( ( { id } ) => id === fieldId )
					)
					.filter( ( field ): field is Field< Item > => !! field )
			),
		[ fields, form.fields ]
	);

	return (
		<VStack spacing={ 4 }>
			{ visibleFields.map( ( field ) => {
				return (
					<DataFormFieldVisibility
						key={ field.id }
						data={ data }
						field={ field }
					>
						<field.Edit
							data={ data }
							field={ field }
							onChange={ onChange }
						/>
					</DataFormFieldVisibility>
				);
			} ) }
		</VStack>
	);
}
