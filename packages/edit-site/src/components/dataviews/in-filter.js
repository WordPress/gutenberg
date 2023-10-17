/**
 * WordPress dependencies
 */
import { SelectControl } from '@wordpress/components';

export default ( { id, fields, view, onChangeView } ) => {
	const options = fields.find( ( f ) => f.id === id )?.elements || [];

	return (
		<SelectControl
			value={ view.filters[ id ] }
			options={ options }
			onChange={ ( value ) => {
				if ( value === '' ) {
					value = undefined;
				}

				onChangeView( ( currentView ) => ( {
					...currentView,
					filters: {
						...currentView.filters,
						[ id ]: value,
					},
				} ) );
			} }
		/>
	);
};
