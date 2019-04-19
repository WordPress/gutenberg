/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';
import { useEffect } from '@wordpress/element';
import { withDispatch, withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import Layout from '../layout';

function EditWidgetsInitializer( { widgetAreas, setupWidgetAreas } ) {
	useEffect( () => {
		if ( ! widgetAreas ) {
			return;
		}
		setupWidgetAreas( widgetAreas );
	}, [ widgetAreas, setupWidgetAreas ] );
	return <Layout />;
}

export default compose( [
	withSelect( ( select ) => {
		const widgetAreas = select( 'core' ).getEntityRecords( 'root', 'widgetArea' );
		return {
			widgetAreas,
		};
	} ),
	withDispatch( ( dispatch ) => {
		const { setupWidgetAreas } = dispatch( 'core/edit-widgets' );
		return {
			setupWidgetAreas,
		};
	} ),
] )( EditWidgetsInitializer );
