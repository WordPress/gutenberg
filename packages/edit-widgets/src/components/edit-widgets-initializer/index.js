/**
 * Internal dependencies
 */
import Layout from '../layout';

/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';

function EditWidgetsInitializer( { settings } ) {
	// Since this module relies on the idea of using a "stub post", a state must be initialized
	// first, or the data layer would attempt to retrieve the stub post from the API.
	const { initializeState } = useDispatch( 'core/edit-widgets' );
	const [ stateInitialized, setStateInitialized ] = useState( false );
	useEffect( () => {
		initializeState();
		setStateInitialized( true );
	}, [] );

	if ( ! stateInitialized ) {
		return null;
	}

	return <Layout blockEditorSettings={ settings } />;
}

export default EditWidgetsInitializer;
