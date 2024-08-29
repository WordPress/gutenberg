/**
 * External dependencies
 */
import type { ChangeEvent } from 'react';

/**
 * WordPress dependencies
 */
import {
	Button,
	Popover,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	__experimentalToggleGroupControlOptionIcon as ToggleGroupControlOptionIcon,
	SelectControl,
	__experimentalItemGroup as ItemGroup,
	__experimentalItem as Item,
	__experimentalGrid as Grid,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	__experimentalHeading as Heading,
	__experimentalText as Text,
	privateApis as componentsPrivateApis,
	BaseControl,
} from '@wordpress/components';
import { __, _x, sprintf } from '@wordpress/i18n';
import { memo, useContext, useState, useMemo } from '@wordpress/element';
import { chevronDown, chevronUp, cog, seen, unseen } from '@wordpress/icons';
import warning from '@wordpress/warning';

/**
 * Internal dependencies
 */
import {
	SORTING_DIRECTIONS,
	LAYOUT_GRID,
	LAYOUT_TABLE,
	sortIcons,
	sortLabels,
} from '../../constants';
import { VIEW_LAYOUTS, getMandatoryFields } from '../../dataviews-layouts';
import type { NormalizedField, SupportedLayouts, View } from '../../types';
import DataViewsContext from '../dataviews-context';
import { unlock } from '../../lock-unlock';
import DensityPicker from '../../dataviews-layouts/grid/density-picker';

const { DropdownMenuV2 } = unlock( componentsPrivateApis );

interface ViewTypeMenuProps {
	defaultLayouts?: SupportedLayouts;
}

function ViewTypeMenu( {
	defaultLayouts = { list: {}, grid: {}, table: {} },
}: ViewTypeMenuProps ) {
	const { view, onChangeView } = useContext( DataViewsContext );
	const availableLayouts = Object.keys( defaultLayouts );
	if ( availableLayouts.length <= 1 ) {
		return null;
	}
	const activeView = VIEW_LAYOUTS.find( ( v ) => view.type === v.type );
	return (
		<DropdownMenuV2
			trigger={
				<Button
					size="compact"
					icon={ activeView?.icon }
					label={ __( 'Layout' ) }
				/>
			}
		>
			{ availableLayouts.map( ( layout ) => {
				const config = VIEW_LAYOUTS.find( ( v ) => v.type === layout );
				if ( ! config ) {
					return null;
				}
				return (
					<DropdownMenuV2.RadioItem
						key={ layout }
						value={ layout }
						name="view-actions-available-view"
						checked={ layout === view.type }
						hideOnClick
						onChange={ ( e: ChangeEvent< HTMLInputElement > ) => {
							switch ( e.target.value ) {
								case 'list':
								case 'grid':
								case 'table':
									return onChangeView( {
										...view,
										type: e.target.value,
										...defaultLayouts[ e.target.value ],
									} );
							}
							warning( 'Invalid dataview' );
						} }
					>
						<DropdownMenuV2.ItemLabel>
							{ config.label }
						</DropdownMenuV2.ItemLabel>
					</DropdownMenuV2.RadioItem>
				);
			} ) }
		</DropdownMenuV2>
	);
}

function SortFieldControl() {
	const { view, fields, onChangeView } = useContext( DataViewsContext );
	const orderOptions = useMemo( () => {
		const sortableFields = fields.filter(
			( field ) => field.enableSorting !== false
		);
		return sortableFields.map( ( field ) => {
			return {
				label: field.label,
				value: field.id,
			};
		} );
	}, [ fields ] );

	return (
		<SelectControl
			__nextHasNoMarginBottom
			__next40pxDefaultSize
			label={ __( 'Sort by' ) }
			value={ view.sort?.field }
			options={ orderOptions }
			onChange={ ( value: string ) => {
				onChangeView( {
					...view,
					sort: {
						direction: view?.sort?.direction || 'desc',
						field: value,
					},
				} );
			} }
		/>
	);
}

function SortDirectionControl() {
	const { view, fields, onChangeView } = useContext( DataViewsContext );

	const sortableFields = fields.filter(
		( field ) => field.enableSorting !== false
	);
	if ( sortableFields.length === 0 ) {
		return null;
	}

	let value = view.sort?.direction;
	if ( ! value && view.sort?.field ) {
		value = 'desc';
	}
	return (
		<ToggleGroupControl
			className="dataviews-view-config__sort-direction"
			__nextHasNoMarginBottom
			__next40pxDefaultSize
			isBlock
			label={ __( 'Order' ) }
			value={ value }
			onChange={ ( newDirection ) => {
				if ( newDirection === 'asc' || newDirection === 'desc' ) {
					onChangeView( {
						...view,
						sort: {
							direction: newDirection,
							field:
								view.sort?.field ||
								// If there is no field assigned as the sorting field assign the first sortable field.
								fields.find(
									( field ) => field.enableSorting !== false
								)?.id ||
								'',
						},
					} );
					return;
				}
				warning( 'Invalid direction' );
			} }
		>
			{ SORTING_DIRECTIONS.map( ( direction ) => {
				return (
					<ToggleGroupControlOptionIcon
						key={ direction }
						value={ direction }
						icon={ sortIcons[ direction ] }
						label={ sortLabels[ direction ] }
					/>
				);
			} ) }
		</ToggleGroupControl>
	);
}

const PAGE_SIZE_VALUES = [ 10, 20, 50, 100 ];
function ItemsPerPageControl() {
	const { view, onChangeView } = useContext( DataViewsContext );
	return (
		<ToggleGroupControl
			__nextHasNoMarginBottom
			__next40pxDefaultSize
			isBlock
			label={ __( 'Items per page' ) }
			value={ view.perPage || 10 }
			disabled={ ! view?.sort?.field }
			onChange={ ( newItemsPerPage ) => {
				const newItemsPerPageNumber =
					typeof newItemsPerPage === 'number' ||
					newItemsPerPage === undefined
						? newItemsPerPage
						: parseInt( newItemsPerPage, 10 );
				onChangeView( {
					...view,
					perPage: newItemsPerPageNumber,
					page: 1,
				} );
			} }
		>
			{ PAGE_SIZE_VALUES.map( ( value ) => {
				return (
					<ToggleGroupControlOption
						key={ value }
						value={ value }
						label={ value.toString() }
					/>
				);
			} ) }
		</ToggleGroupControl>
	);
}

function FieldItem( {
	fields,
	fieldId,
	mandatoryFields,
	viewFields,
	view,
	onChangeView,
}: {
	fields: NormalizedField< any >[];
	fieldId: string;
	mandatoryFields: string | any[];
	viewFields: string[];
	view: View;
	onChangeView: ( view: View ) => void;
} ) {
	let fieldLabel;
	let fieldIsHidable;
	const fieldObject = fields.find(
		( f ) => f.id === fieldId
	) as NormalizedField< any >;
	if ( fieldObject ) {
		fieldLabel = fieldObject.label;
		fieldIsHidable =
			fieldObject.enableHiding !== false &&
			! mandatoryFields.includes( fieldId );
	} else if ( view.type === LAYOUT_TABLE ) {
		const combinedFieldObject = view.layout?.combinedFields?.find(
			( f ) => f.id === fieldId
		);
		if ( combinedFieldObject ) {
			fieldLabel = combinedFieldObject.label;
			fieldIsHidable = ! mandatoryFields.includes( fieldId );
		}
	}

	const index = view.fields?.indexOf( fieldId ) as number;
	const isVisible = viewFields.includes( fieldId );
	return (
		<Item key={ fieldId }>
			<HStack
				expanded
				className={ `dataviews-field-control__field dataviews-field-control__field-${ fieldId }` }
			>
				<span>{ fieldLabel }</span>
				<HStack
					justify="flex-end"
					expanded={ false }
					className="dataviews-field-control__actions"
				>
					{ view.type === LAYOUT_TABLE && isVisible && (
						<>
							<Button
								disabled={ ! isVisible || index < 1 }
								accessibleWhenDisabled
								size="compact"
								onClick={ () => {
									if ( ! view.fields || index < 1 ) {
										return;
									}
									onChangeView( {
										...view,
										fields: [
											...( view.fields.slice(
												0,
												index - 1
											) ?? [] ),
											fieldId,
											view.fields[ index - 1 ],
											...view.fields.slice( index + 1 ),
										],
									} );
								} }
								icon={ chevronUp }
								label={ sprintf(
									/* translators: %s: field label */
									__( 'Move %s up' ),
									fieldLabel
								) }
							/>
							<Button
								disabled={
									! isVisible ||
									! view.fields ||
									index >= view.fields.length - 1
								}
								accessibleWhenDisabled
								size="compact"
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
											...( view.fields.slice(
												0,
												index
											) ?? [] ),
											view.fields[ index + 1 ],
											fieldId,
											...view.fields.slice( index + 2 ),
										],
									} );
								} }
								icon={ chevronDown }
								label={ sprintf(
									/* translators: %s: field label */
									__( 'Move %s down' ),
									fieldLabel
								) }
							/>{ ' ' }
						</>
					) }
					<Button
						className="dataviews-field-control__field-visibility-button"
						disabled={ ! fieldIsHidable }
						accessibleWhenDisabled
						size="compact"
						onClick={ () => {
							onChangeView( {
								...view,
								fields: isVisible
									? viewFields.filter(
											( id ) => id !== fieldId
									  )
									: [ ...viewFields, fieldId ],
							} );
							// Focus the visibility button to avoid focus loss.
							// Our code is safe against the component being unmounted, so we don't need to worry about cleaning the timeout.
							// eslint-disable-next-line @wordpress/react-no-unsafe-timeout
							setTimeout( () => {
								const element = document.querySelector(
									`.dataviews-field-control__field-${ fieldId } .dataviews-field-control__field-visibility-button`
								);
								if ( element instanceof HTMLElement ) {
									element.focus();
								}
							}, 50 );
						} }
						icon={ isVisible ? seen : unseen }
						label={
							isVisible
								? sprintf(
										/* translators: %s: field label */
										__( 'Hide %s' ),
										fieldLabel
								  )
								: sprintf(
										/* translators: %s: field label */
										__( 'Show %s' ),
										fieldLabel
								  )
						}
					/>
				</HStack>
			</HStack>
		</Item>
	);
}

function FieldList( {
	fields,
	fieldIds,
	mandatoryFields,
	viewFields,
	view,
	onChangeView,
}: Omit< Parameters< typeof FieldItem >[ 0 ], 'fieldId' > & {
	fieldIds: string[];
} ) {
	return fieldIds.map( ( fieldId ) => (
		<FieldItem
			key={ fieldId }
			fields={ fields }
			fieldId={ fieldId }
			mandatoryFields={ mandatoryFields }
			viewFields={ viewFields }
			view={ view }
			onChangeView={ onChangeView }
		/>
	) );
}

function FieldControl() {
	const { view, fields, onChangeView } = useContext( DataViewsContext );
	const mandatoryFields = useMemo(
		() => getMandatoryFields( view ),
		[ view ]
	);
	const viewFields = view.fields || fields.map( ( field ) => field.id );
	const visibleFields = view.fields;
	const hiddenFields = useMemo( () => {
		const nonViewFieldsList = fields
			.filter(
				( field ) =>
					! viewFields.includes( field.id ) &&
					! mandatoryFields?.includes( field.id )
			)
			.map( ( field ) => field.id );

		if ( view.type !== LAYOUT_TABLE ) {
			return nonViewFieldsList;
		}
		const nonViewFieldsAndNonCombinedList = nonViewFieldsList.filter(
			( fieldId ) => {
				return ! view.layout?.combinedFields?.some( ( combinedField ) =>
					combinedField.children.includes( fieldId )
				);
			}
		);
		const nonViewFieldsCombinedFieldsList =
			view.layout?.combinedFields
				?.filter(
					( combinedField ) =>
						! viewFields.includes( combinedField.id )
				)
				.map( ( combinedField ) => combinedField.id ) || [];
		return [
			...nonViewFieldsAndNonCombinedList,
			...nonViewFieldsCombinedFieldsList,
		];
	}, [ view, mandatoryFields, fields, viewFields ] );
	if ( ! visibleFields?.length && ! hiddenFields?.length ) {
		return null;
	}
	return (
		<VStack spacing={ 4 } className="dataviews-field-control">
			{ !! visibleFields?.length && (
				<ItemGroup isBordered isSeparated>
					<FieldList
						fields={ fields }
						fieldIds={ visibleFields }
						mandatoryFields={ mandatoryFields }
						viewFields={ viewFields }
						view={ view }
						onChangeView={ onChangeView }
					/>
				</ItemGroup>
			) }
			{ !! hiddenFields?.length && (
				<>
					<BaseControl.VisualLabel>
						{ __( 'Hidden' ) }
					</BaseControl.VisualLabel>
					<ItemGroup isBordered isSeparated>
						<FieldList
							fields={ fields }
							fieldIds={ hiddenFields }
							mandatoryFields={ mandatoryFields }
							viewFields={ viewFields }
							view={ view }
							onChangeView={ onChangeView }
						/>
					</ItemGroup>
				</>
			) }
		</VStack>
	);
}

function SettingsSection( {
	title,
	description,
	children,
}: {
	title: string;
	description?: string;
	children: React.ReactNode;
} ) {
	return (
		<Grid columns={ 12 } className="dataviews-settings-section" gap={ 4 }>
			<div className="dataviews-settings-section__sidebar">
				<Heading
					level={ 2 }
					className="dataviews-settings-section__title"
				>
					{ title }
				</Heading>
				{ description && (
					<Text
						variant="muted"
						className="dataviews-settings-section__description"
					>
						{ description }
					</Text>
				) }
			</div>
			<Grid
				columns={ 8 }
				gap={ 4 }
				className="dataviews-settings-section__content"
			>
				{ children }
			</Grid>
		</Grid>
	);
}

function DataviewsViewConfigContent( {
	density,
	setDensity,
}: {
	density: number;
	setDensity: React.Dispatch< React.SetStateAction< number > >;
} ) {
	const { view } = useContext( DataViewsContext );
	return (
		<VStack className="dataviews-view-config" spacing={ 6 }>
			<SettingsSection title={ __( 'Appearance' ) }>
				<HStack expanded className="is-divided-in-two">
					<SortFieldControl />
					<SortDirectionControl />
				</HStack>
				{ view.type === LAYOUT_GRID && (
					<DensityPicker
						density={ density }
						setDensity={ setDensity }
					/>
				) }
				<ItemsPerPageControl />
			</SettingsSection>
			<SettingsSection title={ __( 'Properties' ) }>
				<FieldControl />
			</SettingsSection>
		</VStack>
	);
}

function _DataViewsViewConfig( {
	density,
	setDensity,
	defaultLayouts = { list: {}, grid: {}, table: {} },
}: {
	density: number;
	setDensity: React.Dispatch< React.SetStateAction< number > >;
	defaultLayouts?: SupportedLayouts;
} ) {
	const [ isShowingViewPopover, setIsShowingViewPopover ] =
		useState< boolean >( false );

	return (
		<>
			<ViewTypeMenu defaultLayouts={ defaultLayouts } />
			<div>
				<Button
					size="compact"
					icon={ cog }
					label={ _x( 'View options', 'View is used as a noun' ) }
					onClick={ () => setIsShowingViewPopover( true ) }
				/>
				{ isShowingViewPopover && (
					<Popover
						placement="bottom-end"
						onClose={ () => {
							setIsShowingViewPopover( false );
						} }
						focusOnMount
					>
						<DataviewsViewConfigContent
							density={ density }
							setDensity={ setDensity }
						/>
					</Popover>
				) }
			</div>
		</>
	);
}

const DataViewsViewConfig = memo( _DataViewsViewConfig );

export default DataViewsViewConfig;
