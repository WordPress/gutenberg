/**
 * WordPress dependencies
 */
import { closeSmall } from '@wordpress/icons';
import { Button } from '@wordpress/components';

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
		const field = fields.find( ( element ) => element.id === id );
		const value = field.setList.find(
			( element ) => element.id === view.filters[ id ]
		);
		if ( ! value ) {
			return null;
		}

		return (
			<ActiveFilter
				key={ id }
				filterName={ field?.header ?? field?.id }
				filterValue={ value?.name ?? value.id }
				filterId={ id }
				onChangeView={ onChangeView }
			/>
		);
	} );
}
