/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import type { DataFormControlProps, NormalizedField } from '../types';

type RowType = Record< string, unknown >;

export default function TableControl< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
}: DataFormControlProps< Item > ) {
	const { label, children, getValue, setValue } = field;
	const value = getValue( { item: data } );

	const onChangeRow = useCallback(
		(
			rowIndex: number,
			childField: NormalizedField< RowType >,
			newValue: any
		) => {
			// DataForm takes a generic Item type that defines the shape of the data, as in:
			// { id: 1, table: [ {column1: '', column2: ''}] }
			//
			// At this point, we are working with each item of the array, an object like
			// { column1: '', column2: '' }, but we don't have its type information,
			// hence the RowType.
			const updatedValue = value.map( ( row: RowType, index: number ) => {
				if ( index === rowIndex ) {
					return { ...row, ...newValue };
				}
				return row;
			} );

			onChange( setValue( { item: data, value: updatedValue } ) );
		},
		[ value, onChange, setValue, data ]
	);

	if ( ! Array.isArray( children ) || children.length === 0 ) {
		return null;
	}

	if ( ! Array.isArray( value ) || value.length === 0 ) {
		return <div>{ __( 'No data to display.' ) }</div>;
	}

	return (
		<div className="dataform-control-array-table">
			{ ! hideLabelFromVision && label && (
				<div className="dataform-control-array-table__label">
					{ label }
				</div>
			) }
			<div className="dataform-control-array-table__wrapper">
				<table className="dataform-control-array-table__table">
					<thead>
						<tr>
							{ children.map( ( child ) => (
								<th key={ child.id }>{ child.label }</th>
							) ) }
						</tr>
					</thead>
					<tbody>
						{ value.map( ( row, rowIndex ) => (
							<tr key={ rowIndex }>
								{ children.map( ( childField ) => (
									<td key={ childField.id }>
										{ childField.Edit && (
											<childField.Edit
												data={ row }
												field={ childField }
												onChange={ ( newValue: any ) =>
													onChangeRow(
														rowIndex,
														childField,
														newValue
													)
												}
												hideLabelFromVision
											/>
										) }
									</td>
								) ) }
							</tr>
						) ) }
					</tbody>
				</table>
			</div>
		</div>
	);
}
