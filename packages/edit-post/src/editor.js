/**
 * External dependencies
 */
import { size, map, without, omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { store as blocksStore } from '@wordpress/blocks';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	EditorProvider,
	ErrorBoundary,
	PostLockedModal,
} from '@wordpress/editor';
import { StrictMode, useMemo } from '@wordpress/element';
import {
	KeyboardShortcuts,
	SlotFillProvider,
	__unstableDropZoneContextProvider as DropZoneContextProvider,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import preventEventDiscovery from './prevent-event-discovery';
import Layout from './components/layout';
import EditorInitialization from './components/editor-initialization';
import EditPostSettings from './components/edit-post-settings';
import { store as editPostStore } from './store';

function Editor( {
	postId,
	postType,
	settings,
	initialEdits,
	onError,
	...props
} ) {
	const {
		hasFixedToolbar,
		focusMode,
		hasReducedUI,
		hasThemeStyles,
		post,
		preferredStyleVariations,
		hiddenBlockTypes,
		blockTypes,
		__experimentalLocalAutosaveInterval,
		keepCaretInsideBlock,
		isTemplateMode,
		template,
	} = useSelect( ( select ) => {
		const {
			isFeatureActive,
			getPreference,
			__experimentalGetPreviewDeviceType,
			isEditingTemplate,
		} = select( editPostStore );
		const {
			getEntityRecord,
			__experimentalGetTemplateForLink,
			getPostType,
			getEntityRecords,
		} = select( 'core' );
		const { getEditorSettings, getCurrentPost } = select( 'core/editor' );
		const { getBlockTypes } = select( blocksStore );
		const isTemplate = [ 'wp_template', 'wp_template_part' ].includes(
			postType
		);
		// Ideally the initializeEditor function should be called using the ID of the REST endpoint.
		// to avoid the special case.
		let postObject;
		if ( isTemplate ) {
			const posts = getEntityRecords( 'postType', postType, {
				wp_id: postId,
			} );
			postObject = posts?.[ 0 ];
		} else {
			postObject = getEntityRecord( 'postType', postType, postId );
		}
		const isFSETheme = getEditorSettings().isFSETheme;
		const isViewable = getPostType( postType )?.viewable ?? false;

		return {
			hasFixedToolbar:
				isFeatureActive( 'fixedToolbar' ) ||
				__experimentalGetPreviewDeviceType() !== 'Desktop',
			focusMode: isFeatureActive( 'focusMode' ),
			hasReducedUI: isFeatureActive( 'reducedUI' ),
			hasThemeStyles: isFeatureActive( 'themeStyles' ),
			preferredStyleVariations: getPreference(
				'preferredStyleVariations'
			),
			hiddenBlockTypes: getPreference( 'hiddenBlockTypes' ),
			blockTypes: getBlockTypes(),
			__experimentalLocalAutosaveInterval: getPreference(
				'localAutosaveInterval'
			),
			keepCaretInsideBlock: isFeatureActive( 'keepCaretInsideBlock' ),
			isTemplateMode: isEditingTemplate(),
			template:
				isFSETheme &&
				isViewable &&
				postObject &&
				getCurrentPost().status !== 'auto-draft'
					? __experimentalGetTemplateForLink( postObject.link )
					: null,
			post: postObject,
		};
	} );

	const { updatePreferredStyleVariations, setIsInserterOpened } = useDispatch(
		editPostStore
	);

	const editorSettings = useMemo( () => {
		const result = {
			...omit( settings, [ 'defaultEditorStyles', 'styles' ] ),
			__experimentalPreferredStyleVariations: {
				value: preferredStyleVariations,
				onChange: updatePreferredStyleVariations,
			},
			hasFixedToolbar,
			focusMode,
			hasReducedUI,
			__experimentalLocalAutosaveInterval,

			// This is marked as experimental to give time for the quick inserter to mature.
			__experimentalSetIsInserterOpened: setIsInserterOpened,
			keepCaretInsideBlock,
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

			result.allowedBlockTypes = without(
				defaultAllowedBlockTypes,
				...hiddenBlockTypes
			);
		}

		return result;
	}, [
		settings,
		hasFixedToolbar,
		focusMode,
		hasReducedUI,
		hiddenBlockTypes,
		blockTypes,
		preferredStyleVariations,
		__experimentalLocalAutosaveInterval,
		setIsInserterOpened,
		updatePreferredStyleVariations,
		keepCaretInsideBlock,
	] );

	const styles = useMemo( () => {
		return hasThemeStyles ? settings.styles : settings.defaultEditorStyles;
	}, [ settings, hasThemeStyles ] );

	if ( ! post ) {
		return null;
	}

	return (
		<StrictMode>
			<EditPostSettings.Provider value={ settings }>
				<SlotFillProvider>
					<DropZoneContextProvider>
						<EditorProvider
							settings={ editorSettings }
							post={ post }
							initialEdits={ initialEdits }
							useSubRegistry={ false }
							__unstableTemplate={
								isTemplateMode ? template : undefined
							}
							{ ...props }
						>
							<ErrorBoundary onError={ onError }>
								<EditorInitialization postId={ postId } />
								<Layout styles={ styles } />
								<KeyboardShortcuts
									shortcuts={ preventEventDiscovery }
								/>
							</ErrorBoundary>
							<PostLockedModal />
						</EditorProvider>
					</DropZoneContextProvider>
				</SlotFillProvider>
			</EditPostSettings.Provider>
		</StrictMode>
	);
}

export default Editor;
