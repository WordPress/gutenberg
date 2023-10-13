/**
 * WordPress dependencies
 */
import { closeSmall } from '@wordpress/icons';
import { Button } from '@wordpress/components';

function ActiveFilter( { id, label, onChangeView } ) {
	// TODO. Do not reuse the components-form-token-field classes:
	// either make that component public or create a new one.
	return (
		<span className="components-form-token-field__token">
			<span className="components-form-token-field__token-text">
				{ label }
			</span>
			<Button
				className="components-form-token-field__remove-token"
				icon={ closeSmall }
				onClick={ () => {
					onChangeView( ( currentView ) => {
						delete currentView.filters[ id ];
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

	return Object.keys( view.filters ).map( ( id ) => (
		<ActiveFilter
			key={ id }
			id={ id }
			label={ fields.find( ( field ) => field.id === id )?.header ?? id }
			onChangeView={ onChangeView }
		/>
	) );
}
