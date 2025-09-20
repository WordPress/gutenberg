/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { DataFormControlProps } from '../types';

export default function ArrayTableControl< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
}: DataFormControlProps< Item > ) {
	const { label, children, getValue, setValue } = field;
	const value = getValue( { item: data } );

	const onChangeRow = useCallback(
		( rowIndex: number, childField: any, newValue: any ) => {
			const updatedValue = value.map( ( row: any, index: number ) => {
				if ( index === rowIndex ) {
					return {
						...row,
						[ childField.id ]: newValue,
					};
				}
				return row;
			} );

			onChange( setValue( { item: data, value: updatedValue } ) );
		},
		[ value, onChange, setValue, data ]
	);

	if ( ! children || children.length === 0 ) {
		return null;
	}

	if ( ! Array.isArray( value ) || value.length === 0 ) {
		return <div>No data to display</div>;
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
								<th key={ child.id }>
									{ child.label || child.id }
								</th>
							) ) }
						</tr>
					</thead>
					<tbody>
						{ value.map( ( row, rowIndex ) => (
							<tr key={ rowIndex }>
								{ children.map( ( childField ) => (
									<td key={ childField.id }>
										<input
											type="text"
											value={ row[ childField.id ] || '' }
											onChange={ ( e ) =>
												onChangeRow(
													rowIndex,
													childField,
													e.target.value
												)
											}
											placeholder={
												childField.placeholder
											}
										/>
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
