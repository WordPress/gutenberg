/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { TextControl } from '@wordpress/components';
import { useEffect } from '@wordpress/element';
import { useDebouncedInput } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import type { NormalizedField } from './types';

type DataFormProps< Item > = {
	data: Item;
	fields: NormalizedField< Item >[]; // TODO: use Field. Normalize them first.
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
	const [ value, setValue, debouncedValue ] = useDebouncedInput(
		field.getValue( { item: data } )
	);

	useEffect( () => {
		onUpdate( ( prevItem: any ) => ( {
			...prevItem,
			[ id ]: debouncedValue,
		} ) );
	}, [ debouncedValue ] );

	return (
		<TextControl
			label={ header }
			placeholder={ placeholder }
			value={ value }
			onChange={ setValue }
		/>
	);
}

export default function DataForm< Item >( {
	data,
	fields,
	onUpdate,
}: DataFormProps< Item > ) {
	return fields.map( ( field ) => {
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
