/**
 * WordPress dependencies
 */
import { __experimentalVStack as VStack } from '@wordpress/components';
import { memo, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { normalizeFields } from '../../normalize-fields';
import type { DataFormProps, Field, NormalizedField } from '../../types';

type MemoizedFieldEditProps< Item > = {
	value: Item[ keyof Item ];
	field: NormalizedField< Item >;
	onChange: Pick< DataFormProps< Item >, 'onChange' >[ 'onChange' ];
};

const MemoizedFieldEdit = memo( ( { field, value, onChange } ) => (
	<field.Edit value={ value } field={ field } onChange={ onChange } />
) ) as < Item >( props: MemoizedFieldEditProps< Item > ) => JSX.Element;

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
					<MemoizedFieldEdit
						key={ field.id }
						value={ field.getValue( { item: data } ) }
						field={ field }
						onChange={ onChange }
					/>
				);
			} ) }
		</VStack>
	);
}
