/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';
import { EditorProvider, ErrorBoundary } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import Layout from './components/layout';

function Editor( { settings, hasFixedToolbar, post, defaultPost, onError, ...props } ) {
	if ( ! post ) {
		return null;
	}

	const editorSettings = {
		...settings,
		hasFixedToolbar,
	};

	return (
		<EditorProvider settings={ editorSettings } post={ { ...post, ...defaultPost } } { ...props }>
			<ErrorBoundary onError={ onError }>
				<Layout />
			</ErrorBoundary>
		</EditorProvider>
	);
}

export default withSelect( ( select, { postId } ) => ( {
	hasFixedToolbar: select( 'core/edit-post' ).isFeatureActive( 'fixedToolbar' ),
	post: select( 'core' ).getPost( postId ),
} ) )( Editor );
