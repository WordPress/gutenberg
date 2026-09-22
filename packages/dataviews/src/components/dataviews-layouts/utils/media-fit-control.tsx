import { ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useContext } from '@wordpress/element';
import DataViewsContext from '../../dataviews-context';
import type { ViewGrid, ViewPickerGrid } from '../../../types';

export default function MediaFitControl() {
	const context = useContext( DataViewsContext );
	const view = context.view as ViewGrid | ViewPickerGrid;

	// Opt-in: only consumers that ask for this control get it. Cropping to a
	// square suits datasets whose previews are already uniform (templates,
	// patterns), where ragged previews would just make the grid harder to
	// scan, so this isn't shown everywhere by default.
	if ( ! context.config?.mediaFitControl ) {
		return null;
	}

	// Nothing to fit if the view doesn't render a media field.
	const hasMediaField =
		view.showMedia !== false &&
		context.fields.some( ( field ) => field.id === view.mediaField );
	if ( ! hasMediaField ) {
		return null;
	}

	return (
		<ToggleControl
			label={ __( 'Original aspect ratio' ) }
			checked={ view.layout?.mediaFit === 'contain' }
			onChange={ ( isChecked ) => {
				context.onChangeView( {
					...view,
					layout: {
						...view.layout,
						mediaFit: isChecked ? 'contain' : 'cover',
					},
				} );
			} }
		/>
	);
}
