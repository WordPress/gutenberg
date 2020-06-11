/**
 * External dependencies
 */
import memize from 'memize';
import { size, map, without } from 'lodash';

/**
 * WordPress dependencies
 */
import { withSelect, withDispatch } from '@wordpress/data';
import {
	EditorProvider,
	ErrorBoundary,
	PostLockedModal,
} from '@wordpress/editor';
import { StrictMode, Component } from '@wordpress/element';
import {
	KeyboardShortcuts,
	SlotFillProvider,
	DropZoneProvider,
} from '@wordpress/components';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import preventEventDiscovery from './prevent-event-discovery';
import Layout from './components/layout';
import EditorInitialization from './components/editor-initialization';
import EditPostSettings from './components/edit-post-settings';

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
		preferredStyleVariations,
		__experimentalLocalAutosaveInterval,
		__experimentalOnExpandInserter,
		updatePreferredStyleVariations
	) {
		settings = {
			...settings,
			__experimentalPreferredStyleVariations: {
				value: preferredStyleVariations,
				onChange: updatePreferredStyleVariations,
			},
			hasFixedToolbar,
			focusMode,
			__experimentalLocalAutosaveInterval,

			// This is marked as experimental to give time for the quick inserter to mature.
			__experimentalOnExpandInserter,
		};

		// Omit hidden block types if exists and non-empty.
		if ( size( hiddenBlockTypes ) > 0 ) {
			// Defer to passed setting for `allowedBlockTypes` if provided as
			// anything other than `true` (where `true` is equivalent to allow
			// all block types).
			const defaultAllowedBlockTypes =
				true === settings.allowedBlockTypes
					? map( blockTypes, 'name' )
					: settings.allowedBlockTypes || [];

			settings.allowedBlockTypes = without(
				defaultAllowedBlockTypes,
				...hiddenBlockTypes
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
			preferredStyleVariations,
			__experimentalLocalAutosaveInterval,
			onExpandInserter,
			updatePreferredStyleVariations,
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
			preferredStyleVariations,
			__experimentalLocalAutosaveInterval,
			onExpandInserter,
			updatePreferredStyleVariations
		);

		return (
			<StrictMode>
				<EditPostSettings.Provider value={ settings }>
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
									<KeyboardShortcuts
										shortcuts={ preventEventDiscovery }
									/>
								</ErrorBoundary>
								<PostLockedModal />
							</EditorProvider>
						</DropZoneProvider>
					</SlotFillProvider>
				</EditPostSettings.Provider>
			</StrictMode>
		);
	}
}

export default compose( [
	withSelect( ( select, { postId, postType } ) => {
		const {
			isFeatureActive,
			getPreference,
			__experimentalGetPreviewDeviceType,
		} = select( 'core/edit-post' );
		const { getEntityRecord } = select( 'core' );
		const { getBlockTypes } = select( 'core/blocks' );

		return {
			hasFixedToolbar:
				isFeatureActive( 'fixedToolbar' ) ||
				__experimentalGetPreviewDeviceType() !== 'Desktop',
			focusMode: isFeatureActive( 'focusMode' ),
			post: getEntityRecord( 'postType', postType, postId ),
			preferredStyleVariations: getPreference(
				'preferredStyleVariations'
			),
			hiddenBlockTypes: getPreference( 'hiddenBlockTypes' ),
			blockTypes: getBlockTypes(),
			__experimentalLocalAutosaveInterval: getPreference(
				'localAutosaveInterval'
			),
		};
	} ),
	withDispatch( ( dispatch ) => {
		const { updatePreferredStyleVariations } = dispatch( 'core/edit-post' );
		return {
			updatePreferredStyleVariations,
			onExpandInserter: () =>
				dispatch( 'core/edit-post' ).setIsInserterOpened( true ),
		};
	} ),
] )( Editor );
