/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';
import { EditorProvider, ErrorBoundary } from '@wordpress/editor';
import { StrictMode, Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Layout from './components/layout';

class Editor extends Component {
	constructor( props ) {
		super( ...arguments );

		const { initialEdits, editPost } = props;
		if ( initialEdits ) {
			editPost( initialEdits, { quiet: true } );
		}
	}

	render() {
		const {
			settings,
			hasFixedToolbar,
			focusMode,
			post,
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
					{ ...props }
				>
					<ErrorBoundary onError={ onError }>
						<Layout />
					</ErrorBoundary>
				</EditorProvider>
			</StrictMode>
		);
	}
}

export default compose( [
	withSelect( ( select, { postId, postType } ) => {
		const { isFeatureActive } = select( 'core/edit-post' );
		const { getEntityRecord } = select( 'core' );

		return {
			hasFixedToolbar: isFeatureActive( 'fixedToolbar' ),
			focusMode: isFeatureActive( 'focusMode' ),
			post: getEntityRecord( 'postType', postType, postId ),
		};
	} ),
	withDispatch( ( dispatch ) => {
		const { editPost } = dispatch( 'core/editor' );

		return { editPost };
	} ),
] )( Editor );
