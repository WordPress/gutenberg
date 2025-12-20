/**
 * External dependencies
 */
import fastDeepEqual from 'fast-deep-equal/es6';

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

interface UserInputWidgetProps {
	view: View;
	filter: NormalizedFilter;
	onChangeView: ( view: View ) => void;
	fields: NormalizedField< any >[];
}

export default function InputWidget( {
	filter,
	view,
	onChangeView,
	fields,
}: UserInputWidgetProps ) {
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
			return {
				...currentField,
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
	}, [ fields, filter.field ] );

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
		if ( ! field || ! currentFilter ) {
			return;
		}
		const nextValue = field.getValue( { item: updatedData } );
		if ( fastDeepEqual( nextValue, currentValue ) ) {
			return;
		}

		onChangeView( {
			...view,
			filters: ( view.filters ?? [] ).map( ( _filter ) =>
				_filter.field === filter.field
					? {
							..._filter,
							operator:
								currentFilter.operator || filter.operators[ 0 ],
							// Consider empty strings as undefined:
							//
							// - undefined as value means the filter is unset: the filter widget displays no value and the search returns all records
							// - empty string as value means "search empty string": returns only the records that have an empty string as value
							//
							// In practice, this means the filter will not be able to find an empty string as the value.
							value: nextValue === '' ? undefined : nextValue,
					  }
					: _filter
			),
		} );
	} );

	if ( ! field || ! field.Edit || ! currentFilter ) {
		return null;
	}

	return (
		<Flex
			className="dataviews-filters__user-input-widget"
			gap={ 2.5 }
			direction="column"
		>
			<field.Edit
				hideLabelFromVision
				data={ data }
				field={ field }
				operator={ currentFilter.operator }
				onChange={ handleChange }
			/>
		</Flex>
	);
}
