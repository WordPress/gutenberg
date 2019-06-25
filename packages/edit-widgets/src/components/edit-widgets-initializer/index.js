/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';
import { useEffect } from '@wordpress/element';
import { withDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import Layout from '../layout';
import { withWPCustomize } from '../../utils';

function EditWidgetsInitializer( { setupWidgetAreas, saveWidgetAreas, settings } ) {
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
	return (
		<Layout
			blockEditorSettings={ settings }
		/>
	);
}

export default compose( [
	withDispatch( ( dispatch ) => {
		const { setupWidgetAreas, saveWidgetAreas } = dispatch( 'core/edit-widgets' );
		return {
			setupWidgetAreas,
			saveWidgetAreas,
		};
	} ),
] )( EditWidgetsInitializer );
