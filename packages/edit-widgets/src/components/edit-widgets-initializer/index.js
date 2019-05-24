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

function EditWidgetsInitializer( { setupWidgetAreas } ) {
	useEffect( () => {
		setupWidgetAreas();
	}, [] );
	return <Layout />;
}

export default compose( [
	withDispatch( ( dispatch ) => {
		const { setupWidgetAreas } = dispatch( 'core/edit-widgets' );
		return {
			setupWidgetAreas,
		};
	} ),
] )( EditWidgetsInitializer );
