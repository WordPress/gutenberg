/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { plus, trash } from '@wordpress/icons';

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
	config,
}: DataFormControlProps< Item > ) {
	const { label, children, getValue, setValue } = field;
	const value = getValue( { item: data } );
	const { delete: deleteItemLabel, add: addItemLabel } = config?.actions || {
		delete: 'Remove item',
		add: 'Add item',
	};

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

	const addItem = useCallback( () => {
		const newRow: RowType = {};
		if ( ! Array.isArray( children ) ) {
			return;
		}

		// Initialize new row with default values for each child field
		children.forEach( ( child ) => {
			newRow[ child.id ] = '';
		} );

		const updatedValue = Array.isArray( value )
			? [ ...value, newRow ]
			: [ newRow ];
		onChange( setValue( { item: data, value: updatedValue } ) );
	}, [ children, value, onChange, setValue, data ] );

	const removeItem = useCallback(
		( rowIndex: number ) => {
			const updatedValue = value.filter(
				( _: RowType, index: number ) => index !== rowIndex
			);
			onChange( setValue( { item: data, value: updatedValue } ) );
		},
		[ value, onChange, setValue, data ]
	);

	if ( ! Array.isArray( children ) || children.length === 0 ) {
		return null;
	}

	if ( ! Array.isArray( value ) || value.length === 0 ) {
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
								<th>{ __( 'Actions' ) }</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td
									colSpan={ children.length + 1 }
									style={ {
										textAlign: 'center',
										padding: '20px',
									} }
								>
									{ __( 'No data to display.' ) }
								</td>
							</tr>
						</tbody>
					</table>
				</div>
				<div className="dataform-control-array-table__add-row">
					<Button
						icon={ plus }
						onClick={ addItem }
						variant="secondary"
						__next40pxDefaultSize
					>
						{ __( 'Add item' ) }
					</Button>
				</div>
			</div>
		);
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
							{ deleteItemLabel !== false && (
								<th>{ __( 'Actions' ) }</th>
							) }
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
								{ deleteItemLabel !== false && (
									<td>
										<Button
											icon={ trash }
											label={ deleteItemLabel }
											onClick={ () =>
												removeItem( rowIndex )
											}
											size="small"
											isDestructive
										/>
									</td>
								) }
							</tr>
						) ) }
					</tbody>
				</table>
			</div>
			{ addItemLabel !== false && (
				<div className="dataform-control-array-table__add-row">
					<Button
						icon={ plus }
						onClick={ addItem }
						variant="secondary"
						__next40pxDefaultSize
					>
						{ addItemLabel }
					</Button>
				</div>
			) }
		</div>
	);
}
