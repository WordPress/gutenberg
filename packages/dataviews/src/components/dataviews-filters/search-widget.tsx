/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import * as Ariakit from '@ariakit/react';
import removeAccents from 'remove-accents';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';
import { useState, useMemo, useDeferredValue } from '@wordpress/element';
import {
	VisuallyHidden,
	Icon,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { search, check } from '@wordpress/icons';
import { SVG, Circle } from '@wordpress/primitives';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import type { Filter, NormalizedFilter, View } from '../../types';

const {
	CompositeV2: Composite,
	CompositeItemV2: CompositeItem,
	CompositeHoverV2: CompositeHover,
	CompositeTypeaheadV2: CompositeTypeahead,
} = unlock( componentsPrivateApis );

interface SearchWidgetProps {
	view: View;
	filter: NormalizedFilter;
	onChangeView: ( view: View ) => void;
}

const radioCheck = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Circle cx={ 12 } cy={ 12 } r={ 3 }></Circle>
	</SVG>
);

function normalizeSearchInput( input = '' ) {
	return removeAccents( input.trim().toLowerCase() );
}

const EMPTY_ARRAY: [] = [];
const getCurrentValue = (
	filterDefinition: NormalizedFilter,
	currentFilter?: Filter
) => {
	if ( filterDefinition.singleSelection ) {
		return currentFilter?.value;
	}

	if ( Array.isArray( currentFilter?.value ) ) {
		return currentFilter.value;
	}

	if ( ! Array.isArray( currentFilter?.value ) && !! currentFilter?.value ) {
		return [ currentFilter.value ];
	}

	return EMPTY_ARRAY;
};

const getNewValue = (
	filterDefinition: NormalizedFilter,
	currentFilter: Filter | undefined,
	value: any
) => {
	if ( filterDefinition.singleSelection ) {
		return value;
	}

	if ( Array.isArray( currentFilter?.value ) ) {
		return currentFilter.value.includes( value )
			? currentFilter.value.filter( ( v ) => v !== value )
			: [ ...currentFilter.value, value ];
	}

	return [ value ];
};

function generateCompositeItemId(
	prefix: string,
	filterElement: NormalizedFilter[ 'elements' ][ number ]
) {
	return `${ prefix }-${ filterElement.value }`;
}

function ListBox( { view, filter, onChangeView }: SearchWidgetProps ) {
	const baseId = useInstanceId( ListBox, 'dataviews-filter-list-box' );

	const [ activeCompositeId, setActiveCompositeId ] = useState<
		string | null | undefined
	>(
		// When we have no or just one operator, we can set the first item as active.
		// We do that by setting the initial `activeId` to `undefined`.Otherwise,
		// we set it to `null`, so the first item is not selected,
		// since the focus is on the operators control.
		filter.operators?.length === 1 ? undefined : null
	);
	const currentFilter = view.filters?.find(
		( f ) => f.field === filter.field
	);
	const currentValue = getCurrentValue( filter, currentFilter );
	return (
		<Composite
			virtualFocus
			focusLoop
			activeId={ activeCompositeId }
			setActiveId={ setActiveCompositeId }
			role="listbox"
			className="dataviews-filters__search-widget-listbox"
			aria-label={ sprintf(
				/* translators: List of items for a filter. 1: Filter name. e.g.: "List of: Author". */
				__( 'List of: %1$s' ),
				filter.name
			) }
			onFocusVisible={ () => {
				// `onFocusVisible` needs the `Composite` component to be focusable,
				// which is implicitly achieved via the `virtualFocus: true` option
				// in the `useCompositeStore` hook.
				if ( ! activeCompositeId && filter.elements.length ) {
					setActiveCompositeId(
						generateCompositeItemId( baseId, filter.elements[ 0 ] )
					);
				}
			} }
			render={ <CompositeTypeahead /> }
		>
			{ filter.elements.map( ( element ) => (
				<CompositeHover
					key={ element.value }
					render={
						<CompositeItem
							id={ generateCompositeItemId( baseId, element ) }
							render={
								<div
									aria-label={ element.label }
									role="option"
									className="dataviews-filters__search-widget-listitem"
								/>
							}
							onClick={ () => {
								const newFilters = currentFilter
									? [
											...( view.filters ?? [] ).map(
												( _filter ) => {
													if (
														_filter.field ===
														filter.field
													) {
														return {
															..._filter,
															operator:
																currentFilter.operator ||
																filter
																	.operators[ 0 ],
															value: getNewValue(
																filter,
																currentFilter,
																element.value
															),
														};
													}
													return _filter;
												}
											),
									  ]
									: [
											...( view.filters ?? [] ),
											{
												field: filter.field,
												operator: filter.operators[ 0 ],
												value: getNewValue(
													filter,
													currentFilter,
													element.value
												),
											},
									  ];
								onChangeView( {
									...view,
									page: 1,
									filters: newFilters,
								} );
							} }
						/>
					}
				>
					<span className="dataviews-filters__search-widget-listitem-check">
						{ filter.singleSelection &&
							currentValue === element.value && (
								<Icon icon={ radioCheck } />
							) }
						{ ! filter.singleSelection &&
							currentValue.includes( element.value ) && (
								<Icon icon={ check } />
							) }
					</span>
					<span>{ element.label }</span>
				</CompositeHover>
			) ) }
		</Composite>
	);
}

function ComboboxList( { view, filter, onChangeView }: SearchWidgetProps ) {
	const [ searchValue, setSearchValue ] = useState( '' );
	const deferredSearchValue = useDeferredValue( searchValue );
	const currentFilter = view.filters?.find(
		( _filter ) => _filter.field === filter.field
	);
	const currentValue = getCurrentValue( filter, currentFilter );
	const matches = useMemo( () => {
		const normalizedSearch = normalizeSearchInput( deferredSearchValue );
		return filter.elements.filter( ( item ) =>
			normalizeSearchInput( item.label ).includes( normalizedSearch )
		);
	}, [ filter.elements, deferredSearchValue ] );
	return (
		<Ariakit.ComboboxProvider
			selectedValue={ currentValue }
			setSelectedValue={ ( value ) => {
				const newFilters = currentFilter
					? [
							...( view.filters ?? [] ).map( ( _filter ) => {
								if ( _filter.field === filter.field ) {
									return {
										..._filter,
										operator:
											currentFilter.operator ||
											filter.operators[ 0 ],
										value,
									};
								}
								return _filter;
							} ),
					  ]
					: [
							...( view.filters ?? [] ),
							{
								field: filter.field,
								operator: filter.operators[ 0 ],
								value,
							},
					  ];
				onChangeView( {
					...view,
					page: 1,
					filters: newFilters,
				} );
			} }
			setValue={ setSearchValue }
		>
			<div className="dataviews-filters__search-widget-filter-combobox__wrapper">
				<Ariakit.ComboboxLabel
					render={
						<VisuallyHidden>
							{ __( 'Search items' ) }
						</VisuallyHidden>
					}
				>
					{ __( 'Search items' ) }
				</Ariakit.ComboboxLabel>
				<Ariakit.Combobox
					autoSelect="always"
					placeholder={ __( 'Search' ) }
					className="dataviews-filters__search-widget-filter-combobox__input"
				/>
				<div className="dataviews-filters__search-widget-filter-combobox__icon">
					<Icon icon={ search } />
				</div>
			</div>
			<Ariakit.ComboboxList
				className="dataviews-filters__search-widget-filter-combobox-list"
				alwaysVisible
			>
				{ matches.map( ( element ) => {
					return (
						<Ariakit.ComboboxItem
							resetValueOnSelect={ false }
							key={ element.value }
							value={ element.value }
							className="dataviews-filters__search-widget-listitem"
							hideOnClick={ false }
							setValueOnClick={ false }
							focusOnHover
						>
							<span className="dataviews-filters__search-widget-listitem-check">
								{ filter.singleSelection &&
									currentValue === element.value && (
										<Icon icon={ radioCheck } />
									) }
								{ ! filter.singleSelection &&
									currentValue.includes( element.value ) && (
										<Icon icon={ check } />
									) }
							</span>
							<span>
								<Ariakit.ComboboxItemValue
									className="dataviews-filters__search-widget-filter-combobox-item-value"
									value={ element.label }
								/>
								{ !! element.description && (
									<span className="dataviews-filters__search-widget-listitem-description">
										{ element.description }
									</span>
								) }
							</span>
						</Ariakit.ComboboxItem>
					);
				} ) }
				{ ! matches.length && <p>{ __( 'No results found' ) }</p> }
			</Ariakit.ComboboxList>
		</Ariakit.ComboboxProvider>
	);
}

export default function SearchWidget( props: SearchWidgetProps ) {
	const Widget = props.filter.elements.length > 10 ? ComboboxList : ListBox;
	return <Widget { ...props } />;
}
