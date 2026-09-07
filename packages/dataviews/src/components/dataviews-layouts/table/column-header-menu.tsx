import type { ReactNode, Ref, PropsWithoutRef, RefAttributes } from 'react';
import { __, isRTL } from '@wordpress/i18n';
import { arrowLeft, arrowRight, unseen, funnel } from '@wordpress/icons';
import { Button } from '@wordpress/components';
import { forwardRef, Children, Fragment, useContext } from '@wordpress/element';
// eslint-disable-next-line @wordpress/use-recommended-components -- Intentional early adoption of the new Menu, pending WordPress/gutenberg#76135.
import { Menu } from '@wordpress/ui';
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
		<Menu.Root>
			<Menu.Trigger
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
			</Menu.Trigger>
			<Menu.Popup style={ { minWidth: '240px' } }>
				<WithMenuSeparators>
					{ isSortable && (
						<Menu.RadioGroup
							value={
								isSorted && view.sort
									? view.sort.direction
									: null
							}
							onValueChange={ ( direction: SortDirection ) => {
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
							{ SORTING_DIRECTIONS.map(
								( direction: SortDirection ) => (
									<Menu.RadioItem
										key={ direction }
										value={ direction }
									>
										<Menu.ItemLabel>
											{ sortLabels[ direction ] }
										</Menu.ItemLabel>
									</Menu.RadioItem>
								)
							) }
						</Menu.RadioGroup>
					) }
					{ canAddFilter && (
						<Menu.Group>
							<Menu.Item
								prefix={ <Menu.PrefixIcon icon={ funnel } /> }
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
									prefix={
										<Menu.PrefixIcon icon={ arrowLeft } />
									}
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
									prefix={
										<Menu.PrefixIcon icon={ arrowRight } />
									}
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
								<Menu.SubmenuRoot>
									<Menu.SubmenuTrigger>
										<Menu.ItemLabel>
											{ __( 'Insert left' ) }
										</Menu.ItemLabel>
									</Menu.SubmenuTrigger>
									<Menu.Popup>
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
									</Menu.Popup>
								</Menu.SubmenuRoot>
							) }
							{ canInsertRight && !! hiddenFields.length && (
								<Menu.SubmenuRoot>
									<Menu.SubmenuTrigger>
										<Menu.ItemLabel>
											{ __( 'Insert right' ) }
										</Menu.ItemLabel>
									</Menu.SubmenuTrigger>
									<Menu.Popup>
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
									</Menu.Popup>
								</Menu.SubmenuRoot>
							) }
							{ isHidable && field && (
								<Menu.Item
									prefix={
										<Menu.PrefixIcon icon={ unseen } />
									}
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
			</Menu.Popup>
		</Menu.Root>
	);
} );

// @ts-expect-error Lift the `Item` type argument through the forwardRef.
const ColumnHeaderMenu: < Item >(
	props: PropsWithoutRef< HeaderMenuProps< Item > > &
		RefAttributes< HTMLButtonElement >
) => ReturnType< typeof _HeaderMenu > = _HeaderMenu;

export default ColumnHeaderMenu;
