/**
 * External dependencies
 */
import clsx from 'clsx';
import type { ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	Spinner,
	Flex,
	FlexItem,
	privateApis as componentsPrivateApis,
	Composite,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useInstanceId } from '@wordpress/compose';
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import DataViewsSelectionCheckbox from '../../components/dataviews-selection-checkbox';
import DataViewsContext from '../../components/dataviews-context';
import { useIsMultiselectPicker } from '../../components/dataviews-picker/footer';
import type {
	NormalizedField,
	ViewPickerGrid as ViewPickerGridType,
	ViewPickerGridProps,
} from '../../types';
import type { SetSelection } from '../../types/private';
import { GridItems } from '../utils/grid-items';
const { Badge } = unlock( componentsPrivateApis );
import getDataByGroup from '../utils/get-data-by-group';

interface GridItemProps< Item > {
	view: ViewPickerGridType;
	multiselect?: boolean;
	selection: string[];
	onChangeSelection: SetSelection;
	getItemId: ( item: Item ) => string;
	item: Item;
	titleField?: NormalizedField< Item >;
	mediaField?: NormalizedField< Item >;
	descriptionField?: NormalizedField< Item >;
	regularFields: NormalizedField< Item >[];
	badgeFields: NormalizedField< Item >[];
	config: {
		sizes: string;
	};
	posinset?: number;
	setsize?: number;
}

function GridItem< Item >( {
	view,
	multiselect,
	selection,
	onChangeSelection,
	getItemId,
	item,
	mediaField,
	titleField,
	descriptionField,
	regularFields,
	badgeFields,
	config,
	posinset,
	setsize,
}: GridItemProps< Item > ) {
	const { showTitle = true, showMedia = true, showDescription = true } = view;
	const id = getItemId( item );
	const isSelected = selection.includes( id );
	const renderedMediaField = mediaField?.render ? (
		<mediaField.render
			item={ item }
			field={ mediaField }
			config={ config }
		/>
	) : null;
	const renderedTitleField =
		showTitle && titleField?.render ? (
			<titleField.render item={ item } field={ titleField } />
		) : null;

	return (
		<Composite.Item
			aria-label={
				titleField
					? titleField.getValue( { item } ) || __( '(no title)' )
					: undefined
			}
			key={ id }
			render={ ( { children, ...props } ) => (
				<VStack spacing={ 0 } children={ children } { ...props } />
			) }
			role="option"
			aria-posinset={ posinset }
			aria-setsize={ setsize }
			className={ clsx( 'dataviews-view-picker-grid__card', {
				'is-selected': isSelected,
			} ) }
			aria-selected={ isSelected }
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
			{ showMedia && renderedMediaField && (
				<div className="dataviews-view-picker-grid__media">
					{ renderedMediaField }
				</div>
			) }
			{ showMedia && renderedMediaField && (
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
			) }
			{ showTitle && (
				<HStack
					justify="space-between"
					className="dataviews-view-picker-grid__title-actions"
				>
					<div className="dataviews-view-picker-grid__title-field dataviews-title-field">
						{ renderedTitleField }
					</div>
				</HStack>
			) }
			<VStack spacing={ 1 }>
				{ showDescription && descriptionField?.render && (
					<descriptionField.render
						item={ item }
						field={ descriptionField }
					/>
				) }
				{ !! badgeFields?.length && (
					<HStack
						className="dataviews-view-picker-grid__badge-fields"
						spacing={ 2 }
						wrap
						alignment="top"
						justify="flex-start"
					>
						{ badgeFields.map( ( field ) => {
							return (
								<Badge
									key={ field.id }
									className="dataviews-view-picker-grid__field-value"
								>
									<field.render
										item={ item }
										field={ field }
									/>
								</Badge>
							);
						} ) }
					</HStack>
				) }
				{ !! regularFields?.length && (
					<VStack
						className="dataviews-view-picker-grid__fields"
						spacing={ 1 }
					>
						{ regularFields.map( ( field ) => {
							return (
								<Flex
									className="dataviews-view-picker-grid__field"
									key={ field.id }
									gap={ 1 }
									justify="flex-start"
									expanded
									style={ { height: 'auto' } }
									direction="row"
								>
									<>
										<FlexItem className="dataviews-view-picker-grid__field-name">
											{ field.header }
										</FlexItem>
										<FlexItem
											className="dataviews-view-picker-grid__field-value"
											style={ { maxHeight: 'none' } }
										>
											<field.render
												item={ item }
												field={ field }
											/>
										</FlexItem>
									</>
								</Flex>
							);
						} ) }
					</VStack>
				) }
			</VStack>
		</Composite.Item>
	);
}

function GridGroup< Item >( {
	groupName,
	groupField,
	children,
}: {
	groupName: string;
	groupField: NormalizedField< Item >;
	children: ReactNode;
} ) {
	const headerId = useInstanceId(
		GridGroup,
		'dataviews-view-picker-grid-group__header'
	);
	return (
		<VStack
			key={ groupName }
			spacing={ 2 }
			role="group"
			aria-labelledby={ headerId }
		>
			<h3
				className="dataviews-view-picker-grid-group__header"
				id={ headerId }
			>
				{ sprintf(
					// translators: 1: The label of the field e.g. "Date". 2: The value of the field, e.g.: "May 2022".
					__( '%1$s: %2$s' ),
					groupField.label,
					groupName
				) }
			</h3>
			{ children }
		</VStack>
	);
}

function ViewPickerGrid< Item >( {
	actions,
	data,
	fields,
	getItemId,
	isLoading,
	onChangeSelection,
	selection,
	view,
	className,
	empty,
}: ViewPickerGridProps< Item > ) {
	const { resizeObserverRef, paginationInfo, itemListLabel } =
		useContext( DataViewsContext );
	const titleField = fields.find(
		( field ) => field.id === view?.titleField
	);
	const mediaField = fields.find(
		( field ) => field.id === view?.mediaField
	);
	const descriptionField = fields.find(
		( field ) => field.id === view?.descriptionField
	);
	const otherFields = view.fields ?? [];
	const { regularFields, badgeFields } = otherFields.reduce(
		(
			accumulator: Record< string, NormalizedField< Item >[] >,
			fieldId
		) => {
			const field = fields.find( ( f ) => f.id === fieldId );
			if ( ! field ) {
				return accumulator;
			}
			// If the field is a badge field, add it to the badgeFields array
			// otherwise add it to the rest visibleFields array.
			const key = view.layout?.badgeFields?.includes( fieldId )
				? 'badgeFields'
				: 'regularFields';
			accumulator[ key ].push( field );
			return accumulator;
		},
		{ regularFields: [], badgeFields: [] }
	);
	const hasData = !! data?.length;
	const usedPreviewSize = view.layout?.previewSize;
	const isMultiselect = useIsMultiselectPicker( actions );

	/*
	 * This is the maximum width that an image can achieve in the grid. The reasoning is:
	 * The biggest min image width available is 430px (see /dataviews-layouts/grid/preview-size-picker.tsx).
	 * Because the grid is responsive, once there is room for another column, the images shrink to accommodate it.
	 * So each image will never grow past 2*430px plus a little more to account for the gaps.
	 */
	const size = '900px';

	const groupField = view.groupBy?.field
		? fields.find( ( f ) => f.id === view.groupBy?.field )
		: null;
	const dataByGroup = groupField ? getDataByGroup( data, groupField ) : null;

	const isInfiniteScroll = view.infiniteScrollEnabled && ! dataByGroup;

	const currentPage = view?.page ?? 1;
	const perPage = view?.perPage ?? 0;
	const setSize = isInfiniteScroll ? paginationInfo?.totalItems : undefined;

	return (
		<>
			{
				// Render multiple groups.
				hasData && groupField && dataByGroup && (
					<Composite
						virtualFocus
						orientation="horizontal"
						role="listbox"
						aria-multiselectable={ isMultiselect }
						className={ clsx(
							'dataviews-view-picker-grid',
							className
						) }
						aria-label={ itemListLabel }
						render={ ( { children, ...props } ) => (
							<VStack
								spacing={ 4 }
								children={ children }
								{ ...props }
							/>
						) }
					>
						{ Array.from( dataByGroup.entries() ).map(
							( [ groupName, groupItems ] ) => (
								<GridGroup
									key={ groupName }
									groupName={ groupName }
									groupField={ groupField }
								>
									<GridItems
										previewSize={ usedPreviewSize }
										style={ {
											gridTemplateColumns:
												usedPreviewSize &&
												`repeat(auto-fill, minmax(${ usedPreviewSize }px, 1fr))`,
										} }
										aria-busy={ isLoading }
										ref={
											resizeObserverRef as React.RefObject< HTMLDivElement >
										}
									>
										{ groupItems.map( ( item ) => {
											const posInSet =
												( currentPage - 1 ) * perPage +
												data.indexOf( item ) +
												1;
											return (
												<GridItem
													key={ getItemId( item ) }
													view={ view }
													multiselect={
														isMultiselect
													}
													selection={ selection }
													onChangeSelection={
														onChangeSelection
													}
													getItemId={ getItemId }
													item={ item }
													mediaField={ mediaField }
													titleField={ titleField }
													descriptionField={
														descriptionField
													}
													regularFields={
														regularFields
													}
													badgeFields={ badgeFields }
													config={ {
														sizes: size,
													} }
													posinset={ posInSet }
													setsize={ setSize }
												/>
											);
										} ) }
									</GridItems>
								</GridGroup>
							)
						) }
					</Composite>
				)
			}

			{
				// Render a single grid with all data.
				hasData && ! dataByGroup && (
					<Composite
						render={
							<GridItems
								className={ clsx(
									'dataviews-view-picker-grid',
									className
								) }
								previewSize={ usedPreviewSize }
								aria-busy={ isLoading }
								ref={
									resizeObserverRef as React.RefObject< HTMLDivElement >
								}
							/>
						}
						virtualFocus
						orientation="horizontal"
						role="listbox"
						aria-multiselectable={ isMultiselect }
						aria-label={ itemListLabel }
					>
						{ data.map( ( item, index ) => {
							let posinset = isInfiniteScroll
								? index + 1
								: undefined;

							if ( ! isInfiniteScroll ) {
								// When infinite scroll isn't active, take pagination into account
								// when calculating the posinset.
								posinset =
									( currentPage - 1 ) * perPage + index + 1;
							}

							return (
								<GridItem
									key={ getItemId( item ) }
									view={ view }
									multiselect={ isMultiselect }
									selection={ selection }
									onChangeSelection={ onChangeSelection }
									getItemId={ getItemId }
									item={ item }
									mediaField={ mediaField }
									titleField={ titleField }
									descriptionField={ descriptionField }
									regularFields={ regularFields }
									badgeFields={ badgeFields }
									config={ {
										sizes: size,
									} }
									posinset={ posinset }
									setsize={ setSize }
								/>
							);
						} ) }
					</Composite>
				)
			}
			{
				// Render empty state.
				! hasData && (
					<div
						className={ clsx( {
							'dataviews-loading': isLoading,
							'dataviews-no-results': ! isLoading,
						} ) }
					>
						{ isLoading ? (
							<p>
								<Spinner />
							</p>
						) : (
							empty
						) }
					</div>
				)
			}
			{ hasData && isLoading && (
				<p className="dataviews-loading-more">
					<Spinner />
				</p>
			) }
		</>
	);
}

export default ViewPickerGrid;
