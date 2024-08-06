/**
 * WordPress dependencies
 */
import { __experimentalVStack as VStack } from '@wordpress/components';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { normalizeFields } from '../../normalize-fields';
import type { DataFormProps } from '../../types';

export default function FormRegular< Item >( {
	data,
	fields,
	form,
	onChange,
}: DataFormProps< Item > ) {
	const visibleFields = useMemo(
		() =>
			normalizeFields(
				fields.filter( ( { id } ) => !! form.fields?.includes( id ) )
			),
		[ fields, form.fields ]
	);

	return (
		<VStack spacing={ 4 }>
			{ visibleFields.map( ( field ) => {
				return (
					<field.Edit
						key={ field.id }
						data={ data }
						field={ field }
						onChange={ onChange }
					/>
				);
			} ) }
		</VStack>
	);
}
