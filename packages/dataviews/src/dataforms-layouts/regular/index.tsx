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
	data: Item;
	field: NormalizedField< Item >;
	onChange: Pick< DataFormProps< Item >, 'onChange' >[ 'onChange' ];
};

const MemoizedFieldEdit = memo(
	( { field, data, onChange } ) => (
		<field.Edit data={ data } field={ field } onChange={ onChange } />
	),
	( prevProps, nextProps ) => {
		const prev = prevProps.field.getValue( { item: prevProps.data } );
		const next = nextProps.field.getValue( { item: nextProps.data } );

		return prev === next;
	}
) as < Item >( props: MemoizedFieldEditProps< Item > ) => JSX.Element;

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
						field={ field }
						data={ data }
						onChange={ onChange }
						key={ field.id }
					/>
				);
			} ) }
		</VStack>
	);
}
