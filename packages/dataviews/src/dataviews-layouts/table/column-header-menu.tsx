/**
 * External dependencies
 */
import type { ReactNode, Ref, PropsWithoutRef, RefAttributes } from 'react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { arrowLeft, arrowRight, unseen, funnel } from '@wordpress/icons';
import {
	Button,
	Icon,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { forwardRef, Children, Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { sanitizeOperators } from '../../utils';
import { SORTING_DIRECTIONS, sortArrows, sortLabels } from '../../constants';
import type {
	NormalizedField,
	SortDirection,
	ViewTable as ViewTableType,
	Operator,
} from '../../types';
import { getVisibleFieldIds } from '../index';

const { DropdownMenuV2 } = unlock( componentsPrivateApis );

interface HeaderMenuProps< Item > {
	fieldId: string;
	view: ViewTableType;
	fields: NormalizedField< Item >[];
	onChangeView: ( view: ViewTableType ) => void;
	onHide: ( field: NormalizedField< Item > ) => void;
	setOpenedFilter: ( fieldId: string ) => void;
}

function WithDropDownMenuSeparators( { children }: { children: ReactNode } ) {
	return Children.toArray( children )
		.filter( Boolean )
		.map( ( child, i ) => (
			<Fragment key={ i }>
				{ i > 0 && <DropdownMenuV2.Separator /> }
				{ child }
			</Fragment>
		) );
}

const _HeaderMenu = forwardRef( function HeaderMenu< Item >(
	{
		fieldId,
		view,
		fields,
		onChangeView,
		onHide,
		setOpenedFilter,
	}: HeaderMenuProps< Item >,
	ref: Ref< HTMLButtonElement >
) {
	const visibleFieldIds = getVisibleFieldIds( view, fields );
	const index = visibleFieldIds?.indexOf( fieldId ) as number;
	const isSorted = view.sort?.field === fieldId;
	let isHidable = false;
	let isSortable = false;
	let canAddFilter = false;
	let header;
	let operators: Operator[] = [];

	const combinedField = view.layout?.combinedFields?.find(
		( f ) => f.id === fieldId
	);
	const field = fields.find( ( f ) => f.id === fieldId );

	if ( ! combinedField ) {
		if ( ! field ) {
			// No combined or regular field found.
			return null;
		}

		isHidable = field.enableHiding !== false;
		isSortable = field.enableSorting !== false;
		header = field.header;

		operators = sanitizeOperators( field );
		// Filter can be added:
		// 1. If the field is not already part of a view's filters.
		// 2. If the field meets the type and operator requirements.
		// 3. If it's not primary. If it is, it should be already visible.
		canAddFilter =
			! view.filters?.some( ( _filter ) => fieldId === _filter.field ) &&
			!! field.elements?.length &&
			!! operators.length &&
			! field.filterBy?.isPrimary;
	} else {
		header = combinedField.header || combinedField.label;
	}

	return (
		<DropdownMenuV2
			align="start"
			trigger={
				<Button
					size="compact"
					className="dataviews-view-table-header-button"
					ref={ ref }
					variant="tertiary"
				>
					{ header }
					{ view.sort && isSorted && (
						<span aria-hidden="true">
							{ sortArrows[ view.sort.direction ] }
						</span>
					) }
				</Button>
			}
			style={ { minWidth: '240px' } }
		>
			<WithDropDownMenuSeparators>
				{ isSortable && (
					<DropdownMenuV2.Group>
						{ SORTING_DIRECTIONS.map(
							( direction: SortDirection ) => {
								const isChecked =
									view.sort &&
									isSorted &&
									view.sort.direction === direction;

								const value = `${ fieldId }-${ direction }`;

								return (
									<DropdownMenuV2.RadioItem
										key={ value }
										// All sorting radio items share the same name, so that
										// selecting a sorting option automatically deselects the
										// previously selected one, even if it is displayed in
										// another submenu. The field and direction are passed via
										// the `value` prop.
										name="view-table-sorting"
										value={ value }
										checked={ isChecked }
										onChange={ () => {
											onChangeView( {
												...view,
												sort: {
													field: fieldId,
													direction,
												},
											} );
										} }
									>
										<DropdownMenuV2.ItemLabel>
											{ sortLabels[ direction ] }
										</DropdownMenuV2.ItemLabel>
									</DropdownMenuV2.RadioItem>
								);
							}
						) }
					</DropdownMenuV2.Group>
				) }
				{ canAddFilter && (
					<DropdownMenuV2.Group>
						<DropdownMenuV2.Item
							prefix={ <Icon icon={ funnel } /> }
							onClick={ () => {
								setOpenedFilter( fieldId );
								onChangeView( {
									...view,
									page: 1,
									filters: [
										...( view.filters || [] ),
										{
											field: fieldId,
											value: undefined,
											operator: operators[ 0 ],
										},
									],
								} );
							} }
						>
							<DropdownMenuV2.ItemLabel>
								{ __( 'Add filter' ) }
							</DropdownMenuV2.ItemLabel>
						</DropdownMenuV2.Item>
					</DropdownMenuV2.Group>
				) }
				<DropdownMenuV2.Group>
					<DropdownMenuV2.Item
						prefix={ <Icon icon={ arrowLeft } /> }
						disabled={ index < 1 }
						onClick={ () => {
							onChangeView( {
								...view,
								fields: [
									...( visibleFieldIds.slice(
										0,
										index - 1
									) ?? [] ),
									fieldId,
									visibleFieldIds[ index - 1 ],
									...visibleFieldIds.slice( index + 1 ),
								],
							} );
						} }
					>
						<DropdownMenuV2.ItemLabel>
							{ __( 'Move left' ) }
						</DropdownMenuV2.ItemLabel>
					</DropdownMenuV2.Item>
					<DropdownMenuV2.Item
						prefix={ <Icon icon={ arrowRight } /> }
						disabled={ index >= visibleFieldIds.length - 1 }
						onClick={ () => {
							onChangeView( {
								...view,
								fields: [
									...( visibleFieldIds.slice( 0, index ) ??
										[] ),
									visibleFieldIds[ index + 1 ],
									fieldId,
									...visibleFieldIds.slice( index + 2 ),
								],
							} );
						} }
					>
						<DropdownMenuV2.ItemLabel>
							{ __( 'Move right' ) }
						</DropdownMenuV2.ItemLabel>
					</DropdownMenuV2.Item>
					{ isHidable && field && (
						<DropdownMenuV2.Item
							prefix={ <Icon icon={ unseen } /> }
							onClick={ () => {
								onHide( field );
								onChangeView( {
									...view,
									fields: visibleFieldIds.filter(
										( id ) => id !== fieldId
									),
								} );
							} }
						>
							<DropdownMenuV2.ItemLabel>
								{ __( 'Hide column' ) }
							</DropdownMenuV2.ItemLabel>
						</DropdownMenuV2.Item>
					) }
				</DropdownMenuV2.Group>
			</WithDropDownMenuSeparators>
		</DropdownMenuV2>
	);
} );

// @ts-expect-error Lift the `Item` type argument through the forwardRef.
const ColumnHeaderMenu: < Item >(
	props: PropsWithoutRef< HeaderMenuProps< Item > > &
		RefAttributes< HTMLButtonElement >
) => ReturnType< typeof _HeaderMenu > = _HeaderMenu;

export default ColumnHeaderMenu;
