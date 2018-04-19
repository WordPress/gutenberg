/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';
import { EditorProvider, ErrorBoundary } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import Layout from './components/layout';

function Editor( { settings, hasFixedToolbar, onError, ...props } ) {
	return (
		<EditorProvider settings={ { ...settings, hasFixedToolbar } } { ...props }>
			<ErrorBoundary onError={ onError }>
				<Layout />
			</ErrorBoundary>
		</EditorProvider>
	);
}

export default withSelect( ( select ) => ( {
	hasFixedToolbar: select( 'core/edit-post' ).isFeatureActive( 'fixedToolbar' ),
} ) )( Editor );
