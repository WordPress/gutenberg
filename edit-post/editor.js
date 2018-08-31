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

function Editor( {
	settings,
	hasFixedToolbar,
	focusMode,
	post,
	onError,
	...props
} ) {
	if ( ! post ) {
		return null;
	}

	const editorSettings = {
		...settings,
		hasFixedToolbar,
		focusMode,
	};

	return (
		<StrictMode>
			<EditorProvider
				settings={ editorSettings }
				post={ post }
				{ ...props }
			>
				<ErrorBoundary onError={ onError }>
					<Layout />
				</ErrorBoundary>
			</EditorProvider>
		</StrictMode>
	);
}

export default withSelect( ( select, { postId, postType } ) => ( {
	hasFixedToolbar: select( 'core/edit-post' ).isFeatureActive( 'fixedToolbar' ),
	focusMode: select( 'core/edit-post' ).isFeatureActive( 'focusMode' ),
	post: select( 'core' ).getEntityRecord( 'postType', postType, postId ),
} ) )( Editor );
