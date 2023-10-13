/**
 * WordPress dependencies
 */
import { closeSmall } from '@wordpress/icons';
import { Button } from '@wordpress/components';

function ActiveFilter( { label, onChangeView } ) {
	return (
		<Button
			icon={ closeSmall }
			onClick={ () => {
				onChangeView( ( currentView ) => {
					delete currentView.filters[ label ];
					return {
						...currentView,
					};
				} );
			} }
		>
			{ label }
		</Button>
	);
}

export default function FieldsFilters( { view, onChangeView } ) {
	if ( Object.keys( view.filters ).length === 0 ) {
		return null;
	}

	return Object.keys( view.filters ).map( ( id ) => (
		<ActiveFilter key={ id } label={ id } onChangeView={ onChangeView } />
	) );
}
