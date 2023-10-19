/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import TextFilter from './text-filter';
import InFilter from './in-filter';

export default function Filters( { filters, fields, view, onChangeView } ) {
	const filterIndex = {};
	filters.forEach( ( filter ) => {
		if ( 'object' !== typeof filter || ! filter?.id || ! filter?.type ) {
			return;
		}

		filterIndex[ filter.id ] = filter;
	} );

	fields.forEach( ( field ) => {
		if ( ! field.filters ) {
			return;
		}

		field.filters.forEach( ( filter ) => {
			let id = field.id;
			if ( 'string' === typeof filter ) {
				filterIndex[ id ] = {
					id,
					name: field.header,
					type: filter,
				};
			}

			if ( 'object' === typeof filter ) {
				id = filter.id || field.id;
				filterIndex[ id ] = {
					id,
					name: filter.name || field.header,
					type: filter.type,
				};
			}

			if ( 'enumeration' === filterIndex[ id ]?.type ) {
				const elements = [
					{
						value: filter.resetValue || '',
						label: filter.resetLabel || __( 'All' ),
					},
					...( field.elements || [] ),
				];
				filterIndex[ id ] = {
					...filterIndex[ id ],
					elements,
				};
			}
		} );
	} );

	return (
		view.visibleFilters?.map( ( filterName ) => {
			const filter = filterIndex[ filterName ];

			if ( ! filter ) {
				return null;
			}

			if ( filter.type === 'search' ) {
				return (
					<TextFilter
						key={ filterName }
						filter={ filter }
						view={ view }
						onChangeView={ onChangeView }
					/>
				);
			}
			if ( filter.type === 'enumeration' ) {
				return (
					<InFilter
						key={ filterName }
						filter={ filter }
						view={ view }
						onChangeView={ onChangeView }
					/>
				);
			}

			return null;
		} ) || __( 'No filters available' )
	);
}
