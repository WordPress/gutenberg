/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { default as InFilter, OPERATOR_IN } from './in-filter';
import AddFilter from './add-filter';
import ResetFilters from './reset-filters';

const VALID_OPERATORS = [ OPERATOR_IN ];

export default function Filters( { fields, view, onChangeView } ) {
	const filters = [];
	fields.forEach( ( field ) => {
		if ( ! field.filters ) {
			return;
		}

		field.filters.forEach( ( filter ) => {
			if ( VALID_OPERATORS.some( ( operator ) => operator === filter ) ) {
				filters.push( {
					field: field.id,
					name: field.header,
					operator: filter,
					elements: [
						{
							value: '',
							label: __( 'All' ),
						},
						...( field.elements || [] ),
					],
					isVisible: view.filters.some(
						( f ) => f.field === field.id && f.operator === filter
					),
				} );
			}
		} );
	} );

	const filterComponents = filters?.map( ( filter ) => {
		if ( ! filter.isVisible ) {
			return null;
		}

		if ( OPERATOR_IN === filter.operator ) {
			return (
				<InFilter
					key={ filter.field + '.' + filter.operator }
					filter={ filter }
					view={ view }
					onChangeView={ onChangeView }
				/>
			);
		}

		return null;
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
			<ResetFilters view={ view } onChangeView={ onChangeView } />
		);
	}

	return filterComponents;
}
