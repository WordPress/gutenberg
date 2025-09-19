/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type {
	FieldLayoutProps,
	CombinedFormField,
	NormalizedTableLayout,
	NormalizedField,
} from '../../types';
import DataFormContext from '../../components/dataform-context';

function FormTableField< Item >( {
	data,
	field,
	onChange,
}: FieldLayoutProps< Item > ) {
	const { fields: fieldDefinitions } = useContext( DataFormContext );

	// TODO: get/set rows.
	//
	// A form field doesn't have getValue/setValue functions,
	// so we need to provide a way for it to access the data.
	// Source here is just a string, but it can be a field.
	const rows = ( data as Record< string, unknown > )[
		( field.layout as NormalizedTableLayout ).source
	];
	if ( ! Array.isArray( rows ) ) {
		return null;
	}

	const tableFields = ( field as CombinedFormField ).children
		.filter( ( child ) => typeof child === 'string' )
		.map( ( fieldId ) => {
			const fieldDefinition = fieldDefinitions.find(
				( def ) => def.id === fieldId
			);
			return fieldDefinition;
		} )
		.filter( ( def ): def is NonNullable< typeof def > => Boolean( def ) );
	if ( tableFields.length === 0 ) {
		return null;
	}

	const onChangeRow = (
		index: number,
		fieldDefinition: NormalizedField< Item >,
		newValue: any
	) => {
		onChange( {
			// TODO: get/set rows.
			//
			// A form field doesn't have getValue/setValue functions,
			// so we need to provide a way for it to access the data.
			// Source here is just a string, but it can be a field.
			[ ( field.layout as NormalizedTableLayout ).source ]: rows.map(
				( row, i ) => {
					if ( i === index ) {
						return {
							...row,
							...newValue,
						};
					}
					return row;
				}
			),
		} );
	};

	return (
		<div className="dataforms-layouts-table">
			<div className="dataforms-layouts-table__wrapper">
				<table className="dataforms-layouts-table__table">
					<thead>
						<tr>
							{ tableFields.map( ( fieldDef ) => (
								<th key={ fieldDef.id }>
									{ fieldDef.label || fieldDef.id }
								</th>
							) ) }
						</tr>
					</thead>
					<tbody>
						{ rows.map( ( row, index ) => (
							<tr key={ index }>
								{ tableFields.map( ( tableField ) => {
									return (
										<td key={ tableField.id }>
											{ tableField.Edit && (
												<tableField.Edit
													data={ row }
													field={ tableField }
													onChange={ ( value ) => {
														onChangeRow(
															index,
															tableField,
															value
														);
													} }
													hideLabelFromVision
												/>
											) }
										</td>
									);
								} ) }
							</tr>
						) ) }
					</tbody>
				</table>
			</div>
		</div>
	);
}

export default FormTableField;
