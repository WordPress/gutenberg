/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import * as Ariakit from '@ariakit/react';
import removeAccents from 'remove-accents';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useMemo, useDeferredValue } from '@wordpress/element';
import { BaseControl, VisuallyHidden, Icon } from '@wordpress/components';
import { search } from '@wordpress/icons';
import { SVG, Circle } from '@wordpress/primitives';

const radioCheck = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Circle cx={ 12 } cy={ 12 } r={ 3 }></Circle>
	</SVG>
);

function normalizeSearchInput( input = '' ) {
	return removeAccents( input.trim().toLowerCase() );
}

export default function SearchWidget( { filter, view, onChangeView } ) {
	const [ searchValue, setSearchValue ] = useState( '' );
	const deferredSearchValue = useDeferredValue( searchValue );
	const selectedFilter = view.filters.find(
		( _filter ) => _filter.field === filter.field
	);
	const selectedValues = selectedFilter?.value;
	const matches = useMemo( () => {
		const normalizedSearch = normalizeSearchInput( deferredSearchValue );
		return filter.elements.filter( ( item ) =>
			normalizeSearchInput( item.label ).includes( normalizedSearch )
		);
	}, [ filter.elements, deferredSearchValue ] );
	return (
		<Ariakit.ComboboxProvider
			value={ searchValue }
			setSelectedValue={ ( value ) => {
				const currentFilter = view.filters.find(
					( _filter ) => _filter.field === filter.field
				);
				const newFilters = currentFilter
					? [
							...view.filters.map( ( _filter ) => {
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
							...view.filters,
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
			<BaseControl
				className="dataviews-search-widget-filter-combobox__wrapper"
				__nextHasNoMarginBottom
			>
				<div className="dataviews-search-widget-filter-combobox__input-wrapper">
					<Ariakit.ComboboxLabel render={ <VisuallyHidden /> }>
						{ __( 'Search items' ) }
					</Ariakit.ComboboxLabel>
					<Ariakit.Combobox
						autoSelect="always"
						placeholder={ __( 'Search' ) }
						className="dataviews-search-widget-filter-combobox__input"
					/>
					<div className="dataviews-search-widget-filter-combobox__icon">
						<Icon icon={ search } />
					</div>
				</div>
			</BaseControl>
			<Ariakit.ComboboxList
				className="dataviews-search-widget-filter-combobox-list"
				alwaysVisible
			>
				{ matches.map( ( element ) => {
					return (
						<Ariakit.ComboboxItem
							key={ element.value }
							value={ element.value }
							className="dataviews-search-widget-filter-combobox-item"
							hideOnClick={ false }
							setValueOnClick={ false }
						>
							<span className="dataviews-search-widget-filter-combobox-item-check">
								{ selectedValues === element.value && (
									<Icon icon={ radioCheck } />
								) }
							</span>
							<span>
								<Ariakit.ComboboxItemValue
									className="dataviews-search-widget-filter-combobox-item-value"
									value={ element.label }
								/>
								{ !! element.description && (
									<span className="dataviews-search-widget-filter-combobox-item-description">
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
