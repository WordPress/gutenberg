/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { default as InFilter } from './in-filter';
import AddFilter from './add-filter';
import ResetFilters from './reset-filters';
import { ENUMERATION_TYPE, OPERATOR_IN } from './constants';

export default function Filters( { fields, view, onChangeView } ) {
	const filters = [];
	fields.forEach( ( field ) => {
		if ( ! field.type ) {
			return;
		}

		switch ( field.type ) {
			case ENUMERATION_TYPE:
				filters.push( {
					field: field.id,
					name: field.header,
					elements: [
						{
							value: '',
							label: __( 'All' ),
						},
						...( field.elements || [] ),
					],
					isVisible: view.filters.some(
						( f ) =>
							f.field === field.id && f.operator === OPERATOR_IN
					),
				} );
		}
	} );

	const filterComponents = filters.map( ( filter ) => {
		if ( ! filter.isVisible ) {
			return null;
		}

		return (
			<InFilter
				key={ filter.field + '.' + filter.operator }
				filter={ filter }
				view={ view }
				onChangeView={ onChangeView }
			/>
		);
	} );

	filterComponents.push(
		<AddFilter
			key="add-filter"
			fields={ fields }
			view={ view }
			onChangeView={ onChangeView }
		/>
	);

	if ( filterComponents.length > 1 ) {
		filterComponents.push(
			<ResetFilters
				key="reset-filters"
				view={ view }
				onChangeView={ onChangeView }
			/>
		);
	}

	return filterComponents;
}
