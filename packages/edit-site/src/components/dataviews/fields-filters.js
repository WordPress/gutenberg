/**
 * WordPress dependencies
 */
import { closeSmall } from '@wordpress/icons';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

function ActiveFilter( { filterName, filterValue, filterId, onChangeView } ) {
	// TODO
	// Do not reuse the components-form-token-field classes:
	// either make that component public or create a new one.
	return (
		<span className="components-form-token-field__token">
			<span className="components-form-token-field__token-text">
				{ filterName + ': ' + filterValue }
			</span>
			<Button
				className="components-form-token-field__remove-token"
				icon={ closeSmall }
				onClick={ () => {
					onChangeView( ( currentView ) => {
						delete currentView.filters[ filterId ];
						return {
							...currentView,
						};
					} );
				} }
			/>
		</span>
	);
}

export default function FieldsFilters( { fields, view, onChangeView } ) {
	if ( Object.keys( view.filters ).length === 0 ) {
		return null;
	}

	return Object.keys( view.filters ).map( ( id ) => {
		// TODO: can two fields declare a filter for the same REST API param?
		// This is only looking for the first match.
		const field = fields.find(
			( element ) =>
				element?.filters?.in === id || element?.filters?.notIn === id
		);
		if ( ! field ) {
			return null;
		}

		const value = field.setList.find(
			( element ) => element.id === view.filters[ id ]
		);
		if ( ! value ) {
			return null;
		}

		const isFilterNotIn = field.filters?.notIn === id;
		return (
			<ActiveFilter
				key={ id }
				filterName={
					( field?.header ?? field?.id ) +
					( isFilterNotIn ? ' ' + __( 'not' ) : '' )
				}
				filterValue={ value?.name ?? value.id }
				filterId={ id }
				onChangeView={ onChangeView }
			/>
		);
	} );
}
