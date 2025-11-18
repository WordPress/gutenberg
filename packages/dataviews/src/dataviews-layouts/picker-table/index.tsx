/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Spinner, Composite } from '@wordpress/components';
import {
	useContext,
	useEffect,
	useId,
	useRef,
	useState,
} from '@wordpress/element';

/**
 * Internal dependencies
 */
import DataViewsContext from '../../components/dataviews-context';
import DataViewsSelectionCheckbox from '../../components/dataviews-selection-checkbox';
import { useIsMultiselectPicker } from '../../components/dataviews-picker/footer';
import { BulkSelectionCheckbox } from '../../components/dataviews-bulk-actions';
import { sortValues } from '../../constants';
import type {
	NormalizedField,
	ViewPickerTable as ViewPickerTableType,
	ViewPickerTableProps,
} from '../../types';
import type { SetSelection } from '../../types/private';
import ColumnHeaderMenu from '../table/column-header-menu';
import ColumnPrimary from '../table/column-primary';
import getDataByGroup from '../utils/get-data-by-group';

interface TableColumnFieldProps< Item > {
	fields: NormalizedField< Item >[];
	column: string;
	item: Item;
	align?: 'start' | 'center' | 'end';
}

interface TableRowProps< Item > {
	item: Item;
	fields: NormalizedField< Item >[];
	id: string;
	view: ViewPickerTableType;
	titleField?: NormalizedField< Item >;
	mediaField?: NormalizedField< Item >;
	descriptionField?: NormalizedField< Item >;
	selection: string[];
	getItemId: ( item: Item ) => string;
	onChangeSelection: SetSelection;
	multiselect: boolean;
	posinset?: number;
}

function TableColumnField< Item >( {
	item,
	fields,
	column,
	align,
}: TableColumnFieldProps< Item > ) {
	const field = fields.find( ( f ) => f.id === column );

	if ( ! field ) {
		return null;
	}

	const className = clsx( 'dataviews-view-table__cell-content-wrapper', {
		'dataviews-view-table__cell-align-end': align === 'end',
		'dataviews-view-table__cell-align-center': align === 'center',
	} );

	return (
		<div className={ className }>
			<field.render item={ item } field={ field } />
		</div>
	);
}

function TableRow< Item >( {
	item,
	fields,
	id,
	view,
	titleField,
	mediaField,
	descriptionField,
	selection,
	getItemId,
	onChangeSelection,
	multiselect,
	posinset,
}: TableRowProps< Item > ) {
	const { paginationInfo } = useContext( DataViewsContext );
	const isSelected = selection.includes( id );
	const [ isHovered, setIsHovered ] = useState( false );
	const {
		showTitle = true,
		showMedia = true,
		showDescription = true,
		infiniteScrollEnabled,
	} = view;
	const handleMouseEnter = () => {
		setIsHovered( true );
	};
	const handleMouseLeave = () => {
		setIsHovered( false );
	};

	const columns = view.fields ?? [];
	const hasPrimaryColumn =
		( titleField && showTitle ) ||
		( mediaField && showMedia ) ||
		( descriptionField && showDescription );

	return (
		<Composite.Item
			key={ id }
			render={ ( { children, ...props } ) => (
				<tr
					className={ clsx( 'dataviews-view-table__row', {
						'is-selected': isSelected,
						'is-hovered': isHovered,
					} ) }
					onMouseEnter={ handleMouseEnter }
					onMouseLeave={ handleMouseLeave }
					children={ children }
					{ ...props }
				/>
			) }
			aria-selected={ isSelected }
			aria-setsize={ paginationInfo.totalItems || undefined }
			aria-posinset={ posinset }
			role={ infiniteScrollEnabled ? 'article' : 'option' }
			onClick={ () => {
				if ( isSelected ) {
					onChangeSelection(
						selection.filter( ( itemId ) => id !== itemId )
					);
				} else {
					const newSelection = multiselect
						? [ ...selection, id ]
						: [ id ];
					onChangeSelection( newSelection );
				}
			} }
		>
			<td
				className="dataviews-view-table__checkbox-column"
				role="presentation"
			>
				<div className="dataviews-view-table__cell-content-wrapper">
					<DataViewsSelectionCheckbox
						item={ item }
						selection={ selection }
						onChangeSelection={ onChangeSelection }
						getItemId={ getItemId }
						titleField={ titleField }
						disabled={ false }
						aria-hidden
						tabIndex={ -1 }
					/>
				</div>
			</td>

			{ hasPrimaryColumn && (
				<td role="presentation">
					<ColumnPrimary
						item={ item }
						titleField={ showTitle ? titleField : undefined }
						mediaField={ showMedia ? mediaField : undefined }
						descriptionField={
							showDescription ? descriptionField : undefined
						}
						isItemClickable={ () => false }
					/>
				</td>
			) }
			{ columns.map( ( column: string ) => {
				// Explicit picks the supported styles.
				const { width, maxWidth, minWidth, align } =
					view.layout?.styles?.[ column ] ?? {};

				return (
					<td
						key={ column }
						style={ {
							width,
							maxWidth,
							minWidth,
						} }
						role="presentation"
					>
						<TableColumnField
							fields={ fields }
							item={ item }
							column={ column }
							align={ align }
						/>
					</td>
				);
			} ) }
		</Composite.Item>
	);
}

function ViewPickerTable< Item >( {
	actions,
	data,
	fields,
	getItemId,
	isLoading = false,
	onChangeView,
	onChangeSelection,
	selection,
	setOpenedFilter,
	view,
	className,
	empty,
}: ViewPickerTableProps< Item > ) {
	const headerMenuRefs = useRef<
		Map< string, { node: HTMLButtonElement; fallback: string } >
	>( new Map() );
	const headerMenuToFocusRef = useRef< HTMLButtonElement >();
	const [ nextHeaderMenuToFocus, setNextHeaderMenuToFocus ] =
		useState< HTMLButtonElement >();
	const isMultiselect = useIsMultiselectPicker( actions ) ?? false;

	useEffect( () => {
		if ( headerMenuToFocusRef.current ) {
			headerMenuToFocusRef.current.focus();
			headerMenuToFocusRef.current = undefined;
		}
	} );

	const tableNoticeId = useId();

	if ( nextHeaderMenuToFocus ) {
		// If we need to force focus, we short-circuit rendering here
		// to prevent any additional work while we handle that.
		// Clearing out the focus directive is necessary to make sure
		// future renders don't cause unexpected focus jumps.
		headerMenuToFocusRef.current = nextHeaderMenuToFocus;
		setNextHeaderMenuToFocus( undefined );
		return;
	}

	const onHide = ( field: NormalizedField< Item > ) => {
		const hidden = headerMenuRefs.current.get( field.id );
		const fallback = hidden
			? headerMenuRefs.current.get( hidden.fallback )
			: undefined;
		setNextHeaderMenuToFocus( fallback?.node );
	};

	const hasData = !! data?.length;

	const titleField = fields.find( ( field ) => field.id === view.titleField );
	const mediaField = fields.find( ( field ) => field.id === view.mediaField );
	const descriptionField = fields.find(
		( field ) => field.id === view.descriptionField
	);

	const groupField = view.groupByField
		? fields.find( ( f ) => f.id === view.groupByField )
		: null;
	const dataByGroup = groupField ? getDataByGroup( data, groupField ) : null;
	const { showTitle = true, showMedia = true, showDescription = true } = view;
	const hasPrimaryColumn =
		( titleField && showTitle ) ||
		( mediaField && showMedia ) ||
		( descriptionField && showDescription );
	const columns = view.fields ?? [];
	const headerMenuRef =
		( column: string, index: number ) => ( node: HTMLButtonElement ) => {
			if ( node ) {
				headerMenuRefs.current.set( column, {
					node,
					fallback: columns[ index > 0 ? index - 1 : 1 ],
				} );
			} else {
				headerMenuRefs.current.delete( column );
			}
		};
	const isInfiniteScroll = view.infiniteScrollEnabled && ! dataByGroup;

	return (
		<>
			<table
				className={ clsx(
					'dataviews-view-table',
					'dataviews-view-picker-table',
					className,
					{
						[ `has-${ view.layout?.density }-density` ]:
							view.layout?.density &&
							[ 'compact', 'comfortable' ].includes(
								view.layout.density
							),
					}
				) }
				aria-busy={ isLoading }
				aria-describedby={ tableNoticeId }
				role={ isInfiniteScroll ? 'feed' : 'listbox' }
			>
				<thead role="presentation">
					<tr
						className="dataviews-view-table__row"
						role="presentation"
					>
						<th className="dataviews-view-table__checkbox-column">
							{ isMultiselect && (
								<BulkSelectionCheckbox
									selection={ selection }
									onChangeSelection={ onChangeSelection }
									data={ data }
									actions={ actions }
									getItemId={ getItemId }
								/>
							) }
						</th>
						{ hasPrimaryColumn && (
							<th>
								{ titleField && (
									<ColumnHeaderMenu
										ref={ headerMenuRef(
											titleField.id,
											0
										) }
										fieldId={ titleField.id }
										view={ view }
										fields={ fields }
										onChangeView={ onChangeView }
										onHide={ onHide }
										setOpenedFilter={ setOpenedFilter }
										canMove={ false }
									/>
								) }
							</th>
						) }
						{ columns.map( ( column, index ) => {
							// Explicit picks the supported styles.
							const { width, maxWidth, minWidth, align } =
								view.layout?.styles?.[ column ] ?? {};
							return (
								<th
									key={ column }
									style={ {
										width,
										maxWidth,
										minWidth,
										textAlign: align,
									} }
									aria-sort={
										view.sort?.direction &&
										view.sort?.field === column
											? sortValues[ view.sort.direction ]
											: undefined
									}
									scope="col"
								>
									<ColumnHeaderMenu
										ref={ headerMenuRef( column, index ) }
										fieldId={ column }
										view={ view }
										fields={ fields }
										onChangeView={ onChangeView }
										onHide={ onHide }
										setOpenedFilter={ setOpenedFilter }
										canMove={
											view.layout?.enableMoving ?? true
										}
									/>
								</th>
							);
						} ) }
					</tr>
				</thead>
				{ /* Render grouped data if groupByField is specified */ }
				{ hasData && groupField && dataByGroup ? (
					Array.from( dataByGroup.entries() ).map(
						( [ groupName, groupItems ] ) => (
							<Composite
								key={ `group-${ groupName }` }
								virtualFocus
								orientation="vertical"
								render={ <tbody role="group" /> }
							>
								<tr
									className="dataviews-view-table__group-header-row"
									role="presentation"
								>
									<td
										colSpan={
											columns.length +
											( hasPrimaryColumn ? 1 : 0 ) +
											1
										}
										className="dataviews-view-table__group-header-cell"
										role="presentation"
									>
										{ sprintf(
											// translators: 1: The label of the field e.g. "Date". 2: The value of the field, e.g.: "May 2022".
											__( '%1$s: %2$s' ),
											groupField.label,
											groupName
										) }
									</td>
								</tr>
								{ groupItems.map( ( item, index ) => (
									<TableRow
										key={ getItemId( item ) }
										item={ item }
										fields={ fields }
										id={
											getItemId( item ) ||
											index.toString()
										}
										view={ view }
										titleField={ titleField }
										mediaField={ mediaField }
										descriptionField={ descriptionField }
										selection={ selection }
										getItemId={ getItemId }
										onChangeSelection={ onChangeSelection }
										multiselect={ isMultiselect }
									/>
								) ) }
							</Composite>
						)
					)
				) : (
					<Composite
						render={ <tbody role="presentation" /> }
						virtualFocus
						orientation="vertical"
					>
						{ hasData &&
							data.map( ( item, index ) => (
								<TableRow
									key={ getItemId( item ) }
									item={ item }
									fields={ fields }
									id={ getItemId( item ) || index.toString() }
									view={ view }
									titleField={ titleField }
									mediaField={ mediaField }
									descriptionField={ descriptionField }
									selection={ selection }
									getItemId={ getItemId }
									onChangeSelection={ onChangeSelection }
									multiselect={ isMultiselect }
									posinset={ index + 1 }
								/>
							) ) }
					</Composite>
				) }
			</table>
			<div
				className={ clsx( {
					'dataviews-loading': isLoading,
					'dataviews-no-results': ! hasData && ! isLoading,
				} ) }
				id={ tableNoticeId }
			>
				{ ! hasData &&
					( isLoading ? (
						<p>
							<Spinner />
						</p>
					) : (
						empty
					) ) }
				{ hasData && isLoading && (
					<p className="dataviews-loading-more">
						<Spinner />
					</p>
				) }
			</div>
		</>
	);
}

export default ViewPickerTable;
