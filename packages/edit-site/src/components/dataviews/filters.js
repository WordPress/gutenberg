/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import TextFilter from './text-filter';
import InFilter from './in-filter';

export default function Filters( { fields, view, onChangeView } ) {
	const filters = {};
	fields.forEach( ( field ) => {
		if ( ! field.filters ) {
			return;
		}

		field.filters.forEach( ( f ) => {
			filters[ f.id ] = { type: f.type };
		} );
	} );

	return (
		view.visibleFilters?.map( ( filterName ) => {
			const filter = filters[ filterName ];

			if ( ! filter ) {
				return null;
			}

			if ( filter.type === 'search' ) {
				return (
					<TextFilter
						key={ filterName }
						id={ filterName }
						view={ view }
						onChangeView={ onChangeView }
					/>
				);
			}
			if ( filter.type === 'enumeration' ) {
				return (
					<InFilter
						key={ filterName }
						id={ filterName }
						fields={ fields }
						view={ view }
						onChangeView={ onChangeView }
					/>
				);
			}

			return null;
		} ) || __( 'No filters available' )
	);
}
