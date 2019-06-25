/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { withWPCustomize } from '../../utils';
import CustomizerLayout from '../customizer-layout';

export default function CustomizerEditWidgetsInitializer( { settings } ) {
	const { setupWidgetAreas, saveWidgetAreas } = useDispatch( 'core/edit-widgets' );

	useEffect( () => {
		setupWidgetAreas();
		return withWPCustomize( ( { customize, saveButton } ) => {
			const listener = () => {
				saveWidgetAreas();
				customize.previewer.refresh();
			};
			saveButton.addEventListener( 'click', listener );
			return () => saveButton.removeEventListener( 'click', listener );
		} );
	}, [] );

	return <CustomizerLayout blockEditorSettings={ settings } />;
}
