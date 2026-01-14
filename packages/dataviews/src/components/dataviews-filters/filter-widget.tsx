/**
 * External dependencies
 */
import fastDeepEqual from 'fast-deep-equal/es6/index.js';

/**
 * WordPress dependencies
 */
import { useEvent } from '@wordpress/compose';
import { useMemo } from '@wordpress/element';
import { Flex } from '@wordpress/components';

/**
 * Internal dependencies
 */
import type {
	View,
	NormalizedFilter,
	NormalizedField,
	NormalizedRules,
} from '../../types';
import { getCurrentValue } from './utils';

interface FilterWidgetProps {
	view: View;
	filter: NormalizedFilter;
	onChangeView: ( view: View ) => void;
	fields: NormalizedField< any >[];
}

export default function FilterWidget( {
	filter,
	view,
	onChangeView,
	fields,
}: FilterWidgetProps ) {
	const currentFilter = view.filters?.find(
		( f ) => f.field === filter.field
	);
	const currentValue = getCurrentValue( filter, currentFilter );

	/*
	 * We are reusing the field.Edit component for filters. By doing so,
	 * we get for free a filter control specific to the field type
	 * and other aspects of the field API (Edit control configuration, etc.).
	 *
	 * This approach comes with an issue: the field.Edit controls work with getValue
	 * and setValue methods, which take an item (Item) as parameter. But, at this point,
	 * we don't have an item and we don't know how to create one, either.
	 *
	 * So, what we do is to prepare the data and the relevant field configuration
	 * as if Item was a plain object whose keys are the field ids:
	 *
	 * {
	 *   [ fieldOne.id ]: value,
	 *   [ fieldTwo.id ]: value,
	 * }
	 *
	 */
	const field = useMemo( () => {
		const currentField = fields.find( ( f ) => f.id === filter.field );
		if ( currentField ) {
			// Determine field type: for element-based filters, use singleSelection to decide.
			let fieldType = currentField.type;
			if ( filter.hasElements ) {
				fieldType = filter.singleSelection ? undefined : 'array';
			}
			return {
				...currentField,
				type: fieldType,
				// Deactivate validation for filters.
				isValid: {} satisfies NormalizedRules< any >,
				// Configure getValue/setValue as if Item was a plain object.
				getValue: ( { item }: { item: any } ) =>
					item[ currentField.id ],
				setValue: ( { value }: { value: any } ) => ( {
					[ currentField.id ]: value,
				} ),
			};
		}
		return currentField;
	}, [ fields, filter.field, filter.hasElements, filter.singleSelection ] );

	const data = useMemo( () => {
		return ( view.filters ?? [] ).reduce(
			( acc, activeFilter ) => {
				// We can now assume the field is stored as a Item prop.
				acc[ activeFilter.field ] = activeFilter.value;
				return acc;
			},
			{} as Record< string, any >
		);
	}, [ view.filters ] );

	const handleChange = useEvent( ( updatedData: Record< string, any > ) => {
		if ( ! field ) {
			return;
		}
		const nextValue = field.getValue( { item: updatedData } );
		if ( fastDeepEqual( nextValue, currentValue ) ) {
			return;
		}

		// For non-element filters, require currentFilter to exist.
		if ( ! filter.hasElements && ! currentFilter ) {
			return;
		}

		const newFilters = currentFilter
			? ( view.filters ?? [] ).map( ( f ) =>
					f.field === filter.field
						? {
								...f,
								operator:
									currentFilter.operator ||
									filter.operators[ 0 ],
								// Consider empty strings as undefined:
								//
								// - undefined as value means the filter is unset: the filter widget displays no value and the search returns all records
								// - empty string as value means "search empty string": returns only the records that have an empty string as value
								//
								// In practice, this means the filter will not be able to find an empty string as the value.
								value:
									! filter.hasElements && nextValue === ''
										? undefined
										: nextValue,
						  }
						: f
			  )
			: [
					// Only create new filter for element-based filters.
					...( view.filters ?? [] ),
					{
						field: filter.field,
						operator: filter.operators[ 0 ],
						value: nextValue,
					},
			  ];

		onChangeView( {
			...view,
			// Reset page only for element-based filters.
			...( filter.hasElements ? { page: 1 } : {} ),
			filters: newFilters,
		} );
	} );

	if ( ! field?.Edit || ( ! filter.hasElements && ! currentFilter ) ) {
		return null;
	}

	if ( filter.hasElements ) {
		return (
			<div className="dataviews-filters__search-widget-wrapper">
				<field.Edit
					hideLabelFromVision
					data={ data }
					field={ field }
					onChange={ handleChange }
				/>
			</div>
		);
	}

	return (
		<Flex
			className="dataviews-filters__filter-widget"
			gap={ 2.5 }
			direction="column"
		>
			<field.Edit
				hideLabelFromVision
				data={ data }
				field={ field }
				operator={ currentFilter?.operator }
				onChange={ handleChange }
			/>
		</Flex>
	);
}
