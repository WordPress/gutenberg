/**
 * External dependencies
 */
import memize from 'memize';

/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';
import { EditorProvider, ErrorBoundary, PostLockedModal } from '@wordpress/editor';
import { StrictMode, Component } from '@wordpress/element';
import { KeyboardShortcuts } from '@wordpress/components';

/**
 * Internal dependencies
 */
import preventEventDiscovery from './prevent-event-discovery';
import Layout from './components/layout';

class Editor extends Component {
	constructor() {
		super( ...arguments );

		this.getEditorSettings = memize( this.getEditorSettings, {
			maxSize: 1,
		} );
	}

	getEditorSettings( settings, hasFixedToolbar, focusMode ) {
		return {
			...settings,
			hasFixedToolbar,
			focusMode,
		};
	}

	render() {
		const {
			settings,
			hasFixedToolbar,
			focusMode,
			post,
			initialEdits,
			onError,
			...props
		} = this.props;

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
					initialEdits={ initialEdits }
					{ ...props }
				>
					<ErrorBoundary onError={ onError }>
						<Layout />
						<KeyboardShortcuts shortcuts={ preventEventDiscovery } />
					</ErrorBoundary>
					<PostLockedModal />
				</EditorProvider>
			</StrictMode>
		);
	}
}

export default withSelect( ( select, { postId, postType } ) => ( {
	hasFixedToolbar: select( 'core/edit-post' ).isFeatureActive( 'fixedToolbar' ),
	focusMode: select( 'core/edit-post' ).isFeatureActive( 'focusMode' ),
	post: select( 'core' ).getEntityRecord( 'postType', postType, postId ),
} ) )( Editor );
