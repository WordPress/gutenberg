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
} from '../../types';

const {
	DropdownMenuV2: DropdownMenu,
	DropdownMenuGroupV2: DropdownMenuGroup,
	DropdownMenuItemV2: DropdownMenuItem,
	DropdownMenuRadioItemV2: DropdownMenuRadioItem,
	DropdownMenuItemLabelV2: DropdownMenuItemLabel,
	DropdownMenuSeparatorV2: DropdownMenuSeparator,
} = unlock( componentsPrivateApis );

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
				{ i > 0 && <DropdownMenuSeparator /> }
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
	const combinedField = view.layout?.combinedFields?.find(
		( f ) => f.id === fieldId
	);
	const index = view.fields?.indexOf( fieldId ) as number;
	if ( !! combinedField ) {
		return combinedField.label;
	}
	const field = fields.find( ( f ) => f.id === fieldId );
	if ( ! field ) {
		return null;
	}
	const isHidable = field.enableHiding !== false;
	const isSortable = field.enableSorting !== false;
	const isSorted = view.sort?.field === field.id;
	const operators = sanitizeOperators( field );
	// Filter can be added:
	// 1. If the field is not already part of a view's filters.
	// 2. If the field meets the type and operator requirements.
	// 3. If it's not primary. If it is, it should be already visible.
	const canAddFilter =
		! view.filters?.some( ( _filter ) => field.id === _filter.field ) &&
		!! field.elements?.length &&
		!! operators.length &&
		! field.filterBy?.isPrimary;
	if ( ! isSortable && ! isHidable && ! canAddFilter ) {
		return field.label;
	}
	return (
		<DropdownMenu
			align="start"
			trigger={
				<Button
					size="compact"
					className="dataviews-view-table-header-button"
					ref={ ref }
					variant="tertiary"
				>
					{ field.label }
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
					<DropdownMenuGroup>
						{ SORTING_DIRECTIONS.map(
							( direction: SortDirection ) => {
								const isChecked =
									view.sort &&
									isSorted &&
									view.sort.direction === direction;

								const value = `${ field.id }-${ direction }`;

								return (
									<DropdownMenuRadioItem
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
													field: field.id,
													direction,
												},
											} );
										} }
									>
										<DropdownMenuItemLabel>
											{ sortLabels[ direction ] }
										</DropdownMenuItemLabel>
									</DropdownMenuRadioItem>
								);
							}
						) }
					</DropdownMenuGroup>
				) }
				{ canAddFilter && (
					<DropdownMenuGroup>
						<DropdownMenuItem
							prefix={ <Icon icon={ funnel } /> }
							onClick={ () => {
								setOpenedFilter( field.id );
								onChangeView( {
									...view,
									page: 1,
									filters: [
										...( view.filters || [] ),
										{
											field: field.id,
											value: undefined,
											operator: operators[ 0 ],
										},
									],
								} );
							} }
						>
							<DropdownMenuItemLabel>
								{ __( 'Add filter' ) }
							</DropdownMenuItemLabel>
						</DropdownMenuItem>
					</DropdownMenuGroup>
				) }
				<DropdownMenuGroup>
					<DropdownMenuItem
						prefix={ <Icon icon={ arrowLeft } /> }
						disabled={ index < 1 }
						onClick={ () => {
							if ( ! view.fields || index < 1 ) {
								return;
							}
							onChangeView( {
								...view,
								fields: [
									...( view.fields.slice( 0, index - 1 ) ??
										[] ),
									field.id,
									view.fields[ index - 1 ],
									...view.fields.slice( index + 1 ),
								],
							} );
						} }
					>
						<DropdownMenuItemLabel>
							{ __( 'Move left' ) }
						</DropdownMenuItemLabel>
					</DropdownMenuItem>
					<DropdownMenuItem
						prefix={ <Icon icon={ arrowRight } /> }
						disabled={
							! view.fields || index >= view.fields.length - 1
						}
						onClick={ () => {
							if (
								! view.fields ||
								index >= view.fields.length - 1
							) {
								return;
							}
							onChangeView( {
								...view,
								fields: [
									...( view.fields.slice( 0, index ) ?? [] ),
									view.fields[ index + 1 ],
									field.id,
									...view.fields.slice( index + 2 ),
								],
							} );
						} }
					>
						<DropdownMenuItemLabel>
							{ __( 'Move right' ) }
						</DropdownMenuItemLabel>
					</DropdownMenuItem>
					{ isHidable && (
						<DropdownMenuItem
							prefix={ <Icon icon={ unseen } /> }
							onClick={ () => {
								const viewFields =
									view.fields || fields.map( ( f ) => f.id );
								onHide( field );
								onChangeView( {
									...view,
									fields: viewFields.filter(
										( id ) => id !== field.id
									),
								} );
							} }
						>
							<DropdownMenuItemLabel>
								{ __( 'Hide column' ) }
							</DropdownMenuItemLabel>
						</DropdownMenuItem>
					) }
				</DropdownMenuGroup>
			</WithDropDownMenuSeparators>
		</DropdownMenu>
	);
} );

// @ts-expect-error Lift the `Item` type argument through the forwardRef.
const ColumnHeaderMenu: < Item >(
	props: PropsWithoutRef< HeaderMenuProps< Item > > &
		RefAttributes< HTMLButtonElement >
) => ReturnType< typeof _HeaderMenu > = _HeaderMenu;

export default ColumnHeaderMenu;
