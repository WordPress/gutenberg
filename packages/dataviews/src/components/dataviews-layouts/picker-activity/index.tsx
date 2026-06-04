/**
 * External dependencies
 */
import type { ReactNode } from 'react';
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { Spinner, Composite } from '@wordpress/components';
import { useContext, useMemo, useRef } from '@wordpress/element';
import { useInstanceId } from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';
import { Stack, VisuallyHidden } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import DataViewsContext from '../../dataviews-context';
import { useIsMultiselectPicker } from '../../dataviews-picker-footer';
import getDataByGroup from '../utils/get-data-by-group';
import { useIntersectionObserver } from '../utils/use-infinite-scroll';
import type {
	NormalizedField,
	ViewPickerActivity as ViewPickerActivityType,
	ViewPickerActivityProps,
} from '../../../types';
import type { SetSelection } from '../../../types/private';

function isDefined< T >( item: T | undefined ): item is T {
	return !! item;
}

interface PickerActivityItemProps< Item > {
	view: ViewPickerActivityType;
	multiselect?: boolean;
	selection: string[];
	onChangeSelection: SetSelection;
	getItemId: ( item: Item ) => string;
	item: Item;
	titleField?: NormalizedField< Item >;
	mediaField?: NormalizedField< Item >;
	descriptionField?: NormalizedField< Item >;
	otherFields: NormalizedField< Item >[];
	posinset?: number;
	setsize?: number;
}

function PickerActivityItem< Item >( {
	view,
	multiselect,
	selection,
	onChangeSelection,
	getItemId,
	item,
	titleField,
	mediaField,
	descriptionField,
	otherFields,
	posinset,
	setsize,
}: PickerActivityItemProps< Item > ) {
	const elementRef = useRef< HTMLButtonElement >( null );
	useIntersectionObserver( elementRef, posinset );
	const { showTitle = true, showMedia = true, showDescription = true } = view;
	const id = getItemId( item );
	const isSelected = selection.includes( id );
	const density = view.layout?.density ?? 'balanced';

	const mediaContent =
		showMedia && density !== 'compact' && mediaField?.render ? (
			<mediaField.render
				item={ item }
				field={ mediaField }
				config={ {
					sizes: density === 'comfortable' ? '32px' : '24px',
				} }
			/>
		) : null;

	const renderedMediaField = (
		<div className="dataviews-view-picker-activity__item-type-icon">
			{ mediaContent || (
				<span
					className="dataviews-view-picker-activity__item-bullet"
					aria-hidden="true"
				/>
			) }
		</div>
	);

	const renderedTitleField =
		showTitle && titleField?.render ? (
			<titleField.render item={ item } field={ titleField } />
		) : null;

	const renderedDescriptionField =
		showDescription && descriptionField?.render ? (
			<descriptionField.render item={ item } field={ descriptionField } />
		) : null;

	const verticalGap = useMemo( () => {
		switch ( density ) {
			case 'comfortable':
				return 'md';
			default:
				return 'sm';
		}
	}, [ density ] );

	return (
		<Composite.Item
			ref={ elementRef }
			role="option"
			aria-label={
				titleField
					? titleField.getValue( { item } ) || undefined
					: undefined
			}
			aria-posinset={ posinset }
			aria-setsize={ setsize }
			aria-selected={ isSelected }
			className={ clsx(
				'dataviews-view-picker-activity__item',
				density === 'compact' && 'is-compact',
				density === 'balanced' && 'is-balanced',
				density === 'comfortable' && 'is-comfortable',
				isSelected && 'is-selected'
			) }
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
			render={ <div /> }
		>
			<Stack direction="row" gap="lg" justify="start" align="flex-start">
				<Stack
					direction="column"
					gap="xs"
					align="center"
					className="dataviews-view-picker-activity__item-type"
				>
					{ renderedMediaField }
				</Stack>
				<Stack
					direction="column"
					gap={ verticalGap }
					align="flex-start"
					className="dataviews-view-picker-activity__item-content"
				>
					{ renderedTitleField && (
						<div className="dataviews-view-picker-activity__item-title">
							{ renderedTitleField }
						</div>
					) }
					{ renderedDescriptionField && (
						<div className="dataviews-view-picker-activity__item-description">
							{ renderedDescriptionField }
						</div>
					) }
					<div className="dataviews-view-picker-activity__item-fields">
						{ otherFields.map( ( field ) => (
							<div
								key={ field.id }
								className="dataviews-view-picker-activity__item-field"
							>
								<VisuallyHidden
									render={ <span /> }
									className="dataviews-view-picker-activity__item-field-label"
								>
									{ field.label }
								</VisuallyHidden>
								<span className="dataviews-view-picker-activity__item-field-value">
									<field.render
										item={ item }
										field={ field }
									/>
								</span>
							</div>
						) ) }
					</div>
				</Stack>
			</Stack>
		</Composite.Item>
	);
}

function PickerActivityGroup< Item >( {
	groupName,
	groupField,
	showLabel = true,
	children,
}: {
	groupName: string;
	groupField: NormalizedField< Item >;
	showLabel?: boolean;
	children: ReactNode;
} ) {
	const headerId = useInstanceId(
		PickerActivityGroup,
		'dataviews-view-picker-activity-group__header'
	);
	return (
		<Stack
			direction="column"
			role="group"
			aria-labelledby={ headerId }
			className="dataviews-view-picker-activity-group"
		>
			<h3
				className="dataviews-view-picker-activity-group__header"
				id={ headerId }
			>
				{ showLabel
					? sprintf(
							// translators: 1: The label of the field e.g. "Date". 2: The value of the field, e.g.: "May 2022".
							__( '%1$s: %2$s' ),
							groupField.label,
							groupName
					  )
					: groupName }
			</h3>
			{ children }
		</Stack>
	);
}

export default function ViewPickerActivity< Item >( {
	data,
	fields,
	getItemId,
	isLoading,
	onChangeSelection,
	selection,
	view,
	actions,
	className,
	empty,
}: ViewPickerActivityProps< Item > ) {
	const { itemListLabel, paginationInfo } = useContext( DataViewsContext );
	const isMultiselect = useIsMultiselectPicker( actions );

	const titleField = fields.find(
		( field ) => field.id === view?.titleField
	);
	const mediaField = fields.find(
		( field ) => field.id === view?.mediaField
	);
	const descriptionField = fields.find(
		( field ) => field.id === view?.descriptionField
	);
	const otherFields = ( view?.fields ?? [] )
		.map( ( fieldId ) => fields.find( ( f ) => fieldId === f.id ) )
		.filter( isDefined );

	const groupField = view.groupBy?.field
		? fields.find( ( f ) => f.id === view.groupBy?.field )
		: null;
	const dataByGroup = groupField ? getDataByGroup( data, groupField ) : null;

	const isInfiniteScroll =
		( view.infiniteScrollEnabled && ! dataByGroup ) ?? false;
	const setsize = isInfiniteScroll ? paginationInfo?.totalItems : undefined;

	const hasData = !! data?.length;
	const isGrouped = !! ( groupField && dataByGroup );

	const renderItem = ( item: Item ) => (
		<PickerActivityItem
			key={ getItemId( item ) }
			view={ view }
			multiselect={ isMultiselect }
			selection={ selection }
			onChangeSelection={ onChangeSelection }
			getItemId={ getItemId }
			item={ item }
			titleField={ titleField }
			mediaField={ mediaField }
			descriptionField={ descriptionField }
			otherFields={ otherFields }
			posinset={ ( item as { position?: number } ).position }
			setsize={ setsize }
		/>
	);

	if ( ! hasData ) {
		return (
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
		);
	}

	return (
		<>
			<Composite
				virtualFocus
				orientation="vertical"
				role="listbox"
				aria-multiselectable={ isMultiselect }
				aria-label={ itemListLabel }
				aria-busy={ isLoading }
				render={
					isGrouped ? (
						<Stack direction="column" gap="sm" />
					) : undefined
				}
				className={ clsx(
					'dataviews-view-picker-activity',
					className
				) }
			>
				{ isGrouped && dataByGroup
					? Array.from( dataByGroup.entries() ).map(
							( [ groupName, groupItems ]: [
								string,
								Item[],
							] ) => (
								<PickerActivityGroup< Item >
									key={ groupName }
									groupName={ groupName }
									groupField={ groupField }
									showLabel={
										view.groupBy?.showLabel !== false
									}
								>
									{ groupItems.map( renderItem ) }
								</PickerActivityGroup>
							)
					  )
					: data.map( renderItem ) }
			</Composite>
			{ isLoading && (
				<p className="dataviews-loading-more">
					<Spinner />
				</p>
			) }
		</>
	);
}
