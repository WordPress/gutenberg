/**
 * External dependencies
 */
import memize from 'memize';
import { size, map, without } from 'lodash';

/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';
import { EditorProvider, ErrorBoundary, PostLockedModal } from '@wordpress/editor';
import { StrictMode, Component } from '@wordpress/element';
import {
	KeyboardShortcuts,
	SlotFillProvider,
	DropZoneProvider,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import preventEventDiscovery from './prevent-event-discovery';
import Layout from './components/layout';
import EditorInitialization from './components/editor-initialization';

class Editor extends Component {
	constructor() {
		super( ...arguments );

		this.getEditorSettings = memize( this.getEditorSettings, {
			maxSize: 1,
		} );
	}

	getEditorSettings(
		settings,
		hasFixedToolbar,
		focusMode,
		hiddenBlockTypes,
		blockTypes,
	) {
		settings = {
			...settings,
			hasFixedToolbar,
			focusMode,
		};

		// Omit hidden block types if exists and non-empty.
		if ( size( hiddenBlockTypes ) > 0 ) {
			// Defer to passed setting for `allowedBlockTypes` if provided as
			// anything other than `true` (where `true` is equivalent to allow
			// all block types).
			const defaultAllowedBlockTypes = (
				true === settings.allowedBlockTypes ?
					map( blockTypes, 'name' ) :
					( settings.allowedBlockTypes || [] )
			);

			settings.allowedBlockTypes = without(
				defaultAllowedBlockTypes,
				...hiddenBlockTypes,
			);
		}

		return settings;
	}

	render() {
		const {
			settings,
			hasFixedToolbar,
			focusMode,
			post,
			postId,
			initialEdits,
			onError,
			hiddenBlockTypes,
			blockTypes,
			...props
		} = this.props;

		if ( ! post ) {
			return null;
		}

		const editorSettings = this.getEditorSettings(
			settings,
			hasFixedToolbar,
			focusMode,
			hiddenBlockTypes,
			blockTypes,
		);

		return (
			<StrictMode>
				<SlotFillProvider>
					<DropZoneProvider>
						<EditorProvider
							settings={ editorSettings }
							post={ post }
							initialEdits={ initialEdits }
							useSubRegistry={ false }
							{ ...props }
						>
							<ErrorBoundary onError={ onError }>
								<EditorInitialization postId={ postId } />
								<Layout />
								<KeyboardShortcuts shortcuts={ preventEventDiscovery } />
							</ErrorBoundary>
							<PostLockedModal />
						</EditorProvider>
					</DropZoneProvider>
				</SlotFillProvider>
			</StrictMode>
		);
	}
}

export default withSelect( ( select, { postId, postType } ) => {
	const { isFeatureActive, getPreference } = select( 'core/edit-post' );
	const { getEntityRecord } = select( 'core' );
	const { getBlockTypes } = select( 'core/blocks' );

	return {
		hasFixedToolbar: isFeatureActive( 'fixedToolbar' ),
		focusMode: isFeatureActive( 'focusMode' ),
		post: getEntityRecord( 'postType', postType, postId ),
		hiddenBlockTypes: getPreference( 'hiddenBlockTypes' ),
		blockTypes: getBlockTypes(),
	};
} )( Editor );
