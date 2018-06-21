/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';
import { EditorProvider, ErrorBoundary } from '@wordpress/editor';
import { StrictMode } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Layout from './components/layout';
import store from './store';

const initializeStore = () => store.dispatch( { type: 'INIT' } );

function Editor( { settings, hasFixedToolbar, post, overridePost, onError, ...props } ) {
	if ( ! post ) {
		return null;
	}

	const editorSettings = {
		...settings,
		hasFixedToolbar,
	};

	return (
		<StrictMode>
			<EditorProvider
				settings={ editorSettings }
				post={ { ...post, ...overridePost } }
				onStoreCreated={ initializeStore }
				{ ...props }>
				<ErrorBoundary onError={ onError }>
					<Layout />
				</ErrorBoundary>
			</EditorProvider>
		</StrictMode>
	);
}

export default withSelect( ( select, { postId, postType } ) => ( {
	hasFixedToolbar: select( 'core/edit-post' ).isFeatureActive( 'fixedToolbar' ),
	post: select( 'core' ).getEntityRecord( 'postType', postType, postId ),
} ) )( Editor );
