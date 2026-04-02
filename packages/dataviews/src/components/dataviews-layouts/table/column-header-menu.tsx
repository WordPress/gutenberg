/**
 * External dependencies
 */
import type { ReactNode, Ref, PropsWithoutRef, RefAttributes } from 'react';

/**
 * WordPress dependencies
 */
import { __, isRTL } from '@wordpress/i18n';
import { arrowLeft, arrowRight, unseen, funnel } from '@wordpress/icons';
import {
	Button,
	Icon,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { forwardRef, Children, Fragment, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from '../../../lock-unlock';
import { SORTING_DIRECTIONS, sortArrows, sortLabels } from '../../../constants';
import type {
	NormalizedField,
	SortDirection,
	ViewTable as ViewTableType,
	ViewPickerTable as ViewPickerTableType,
	Operator,
} from '../../../types';
import DataViewsContext from '../../dataviews-context';
import getHideableFields from '../../../utils/get-hideable-fields';

const { Menu } = unlock( componentsPrivateApis );

interface HeaderMenuProps< Item > {
	fieldId: string;
	view: ViewTableType | ViewPickerTableType;
	fields: NormalizedField< Item >[];
	onChangeView: ( view: ViewTableType | ViewPickerTableType ) => void;
	onHide: ( field: NormalizedField< Item > ) => void;
	setOpenedFilter: ( fieldId: string ) => void;
	canMove?: boolean;
	canInsertLeft?: boolean;
	canInsertRight?: boolean;
}

function WithMenuSeparators( { children }: { children: ReactNode } ) {
	return Children.toArray( children )
		.filter( Boolean )
		.map( ( child, i ) => (
			<Fragment key={ i }>
				{ i > 0 && <Menu.Separator /> }
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
		canMove = true,
		canInsertLeft = true,
		canInsertRight = true,
	}: HeaderMenuProps< Item >,
	ref: Ref< HTMLButtonElement >
) {
	const visibleFieldIds = view.fields ?? [];
	const index = visibleFieldIds?.indexOf( fieldId ) as number;
	const isSorted = view.sort?.field === fieldId;
	let isHidable = false;
	let isSortable = false;
	let canAddFilter = false;
	let operators: Operator[] = [];
	const field = fields.find( ( f ) => f.id === fieldId );

	const { setIsShowingFilter } = useContext( DataViewsContext );

	if ( ! field ) {
		// No combined or regular field found.
		return null;
	}

	isHidable = field.enableHiding !== false;
	isSortable = field.enableSorting !== false;
	const header = field.header;

	operators = ( !! field.filterBy && field.filterBy?.operators ) || [];

	// Filter can be added if:
	//
	// 1. The field is not already part of a view's filters.
	// 2. The field has elements or Edit property.
	// 3. The field does not opt-out of filtering.
	// 4. The filter is not primary (if it is, it is already visible).
	canAddFilter =
		! view.filters?.some( ( _filter ) => fieldId === _filter.field ) &&
		!! ( field.hasElements || field.Edit ) &&
		field.filterBy !== false &&
		! field.filterBy?.isPrimary;

	if ( ! isSortable && ! canMove && ! isHidable && ! canAddFilter ) {
		return header;
	}

	const hiddenFields = getHideableFields( view, fields ).filter(
		( f ) => ! visibleFieldIds.includes( f.id )
	);
	const canInsert =
		( canInsertLeft || canInsertRight ) && !! hiddenFields.length;

	const isRtl = isRTL();

	return (
		<Menu>
			<Menu.TriggerButton
				render={
					<Button
						size="compact"
						className="dataviews-view-table-header-button"
						ref={ ref }
						variant="tertiary"
					/>
				}
			>
				{ header }
				{ view.sort && isSorted && (
					<span aria-hidden="true">
						{ sortArrows[ view.sort.direction ] }
					</span>
				) }
			</Menu.TriggerButton>
			<Menu.Popover style={ { minWidth: '240px' } }>
				<WithMenuSeparators>
					{ isSortable && (
						<Menu.Group>
							{ SORTING_DIRECTIONS.map(
								( direction: SortDirection ) => {
									const isChecked =
										view.sort &&
										isSorted &&
										view.sort.direction === direction;

									const value = `${ fieldId }-${ direction }`;

									return (
										<Menu.RadioItem
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
													showLevels: false,
												} );
											} }
										>
											<Menu.ItemLabel>
												{ sortLabels[ direction ] }
											</Menu.ItemLabel>
										</Menu.RadioItem>
									);
								}
							) }
						</Menu.Group>
					) }
					{ canAddFilter && (
						<Menu.Group>
							<Menu.Item
								prefix={ <Icon icon={ funnel } /> }
								onClick={ () => {
									setOpenedFilter( fieldId );
									setIsShowingFilter( true );
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
								<Menu.ItemLabel>
									{ __( 'Add filter' ) }
								</Menu.ItemLabel>
							</Menu.Item>
						</Menu.Group>
					) }
					{ ( canMove || isHidable || canInsert ) && field && (
						<Menu.Group>
							{ canMove && (
								<Menu.Item
									prefix={ <Icon icon={ arrowLeft } /> }
									disabled={
										isRtl
											? index >=
											  visibleFieldIds.length - 1
											: index < 1
									}
									onClick={ () => {
										// In RTL, moving left visually means moving right in the array
										const targetIndex = isRtl
											? index + 1
											: index - 1;
										const newFields = [
											...visibleFieldIds,
										];
										newFields.splice( index, 1 );
										newFields.splice(
											targetIndex,
											0,
											fieldId
										);
										onChangeView( {
											...view,
											fields: newFields,
										} );
									} }
								>
									<Menu.ItemLabel>
										{ __( 'Move left' ) }
									</Menu.ItemLabel>
								</Menu.Item>
							) }
							{ canMove && (
								<Menu.Item
									prefix={ <Icon icon={ arrowRight } /> }
									disabled={
										isRtl
											? index < 1
											: index >=
											  visibleFieldIds.length - 1
									}
									onClick={ () => {
										// In RTL, moving right visually means moving left in the array
										const targetIndex = isRtl
											? index - 1
											: index + 1;
										const newFields = [
											...visibleFieldIds,
										];
										newFields.splice( index, 1 );
										newFields.splice(
											targetIndex,
											0,
											fieldId
										);
										onChangeView( {
											...view,
											fields: newFields,
										} );
									} }
								>
									<Menu.ItemLabel>
										{ __( 'Move right' ) }
									</Menu.ItemLabel>
								</Menu.Item>
							) }
							{ canInsertLeft && !! hiddenFields.length && (
								<Menu>
									<Menu.SubmenuTriggerItem>
										<Menu.ItemLabel>
											{ __( 'Insert left' ) }
										</Menu.ItemLabel>
									</Menu.SubmenuTriggerItem>
									<Menu.Popover>
										{ hiddenFields.map( ( hiddenField ) => {
											const insertIndex = isRtl
												? index + 1
												: index;
											return (
												<Menu.Item
													key={ hiddenField.id }
													onClick={ () => {
														onChangeView( {
															...view,
															fields: [
																...visibleFieldIds.slice(
																	0,
																	insertIndex
																),
																hiddenField.id,
																...visibleFieldIds.slice(
																	insertIndex
																),
															],
														} );
													} }
												>
													<Menu.ItemLabel>
														{ hiddenField.label }
													</Menu.ItemLabel>
												</Menu.Item>
											);
										} ) }
									</Menu.Popover>
								</Menu>
							) }
							{ canInsertRight && !! hiddenFields.length && (
								<Menu>
									<Menu.SubmenuTriggerItem>
										<Menu.ItemLabel>
											{ __( 'Insert right' ) }
										</Menu.ItemLabel>
									</Menu.SubmenuTriggerItem>
									<Menu.Popover>
										{ hiddenFields.map( ( hiddenField ) => {
											const insertIndex = isRtl
												? index
												: index + 1;
											return (
												<Menu.Item
													key={ hiddenField.id }
													onClick={ () => {
														onChangeView( {
															...view,
															fields: [
																...visibleFieldIds.slice(
																	0,
																	insertIndex
																),
																hiddenField.id,
																...visibleFieldIds.slice(
																	insertIndex
																),
															],
														} );
													} }
												>
													<Menu.ItemLabel>
														{ hiddenField.label }
													</Menu.ItemLabel>
												</Menu.Item>
											);
										} ) }
									</Menu.Popover>
								</Menu>
							) }
							{ isHidable && field && (
								<Menu.Item
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
									<Menu.ItemLabel>
										{ __( 'Hide column' ) }
									</Menu.ItemLabel>
								</Menu.Item>
							) }
						</Menu.Group>
					) }
				</WithMenuSeparators>
			</Menu.Popover>
		</Menu>
	);
} );

// @ts-expect-error Lift the `Item` type argument through the forwardRef.
const ColumnHeaderMenu: < Item >(
	props: PropsWithoutRef< HeaderMenuProps< Item > > &
		RefAttributes< HTMLButtonElement >
) => ReturnType< typeof _HeaderMenu > = _HeaderMenu;

export default ColumnHeaderMenu;
