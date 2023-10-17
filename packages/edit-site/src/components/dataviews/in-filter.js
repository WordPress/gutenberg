/**
 * WordPress dependencies
 */
import { SelectControl } from '@wordpress/components';

export default ( { id, options, view, onChangeView } ) => {
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
