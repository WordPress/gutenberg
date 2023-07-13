/**
 * WordPress dependencies
 */
import { store as blocksStore } from '@wordpress/blocks';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	ErrorBoundary,
	PostLockedModal,
	store as editorStore,
	privateApis as editorPrivateApis,
} from '@wordpress/editor';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { useMemo } from '@wordpress/element';
import { SlotFillProvider } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { ShortcutProvider } from '@wordpress/keyboard-shortcuts';
import { store as preferencesStore } from '@wordpress/preferences';
import { CommandMenu } from '@wordpress/commands';
import { privateApis as coreCommandsPrivateApis } from '@wordpress/core-commands';

/**
 * Internal dependencies
 */
import Layout from './components/layout';
import EditorInitialization from './components/editor-initialization';
import { store as editPostStore } from './store';
import { unlock } from './lock-unlock';
import useCommonCommands from './hooks/commands/use-common-commands';

const { ExperimentalEditorProvider } = unlock( editorPrivateApis );
const { getLayoutStyles } = unlock( blockEditorPrivateApis );
const { useCommands } = unlock( coreCommandsPrivateApis );

function Editor( { postId, postType, settings, initialEdits, ...props } ) {
	useCommands();
	useCommonCommands();
	const {
		hasFixedToolbar,
		focusMode,
		isDistractionFree,
		hasInlineToolbar,
		hasThemeStyles,
		post,
		preferredStyleVariations,
		hiddenBlockTypes,
		blockTypes,
		keepCaretInsideBlock,
		isTemplateMode,
		template,
	} = useSelect(
		( select ) => {
			const {
				isFeatureActive,
				__experimentalGetPreviewDeviceType,
				isEditingTemplate,
				getEditedPostTemplate,
				getHiddenBlockTypes,
			} = select( editPostStore );
			const { getEntityRecord, getPostType, getEntityRecords, canUser } =
				select( coreStore );
			const { getEditorSettings } = select( editorStore );
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
			const supportsTemplateMode =
				getEditorSettings().supportsTemplateMode;
			const isViewable = getPostType( postType )?.viewable ?? false;
			const canEditTemplate = canUser( 'create', 'templates' );

			return {
				hasFixedToolbar:
					isFeatureActive( 'fixedToolbar' ) ||
					__experimentalGetPreviewDeviceType() !== 'Desktop',
				focusMode: isFeatureActive( 'focusMode' ),
				isDistractionFree: isFeatureActive( 'distractionFree' ),
				hasInlineToolbar: isFeatureActive( 'inlineToolbar' ),
				hasThemeStyles: isFeatureActive( 'themeStyles' ),
				preferredStyleVariations: select( preferencesStore ).get(
					'core/edit-post',
					'preferredStyleVariations'
				),
				hiddenBlockTypes: getHiddenBlockTypes(),
				blockTypes: getBlockTypes(),
				keepCaretInsideBlock: isFeatureActive( 'keepCaretInsideBlock' ),
				isTemplateMode: isEditingTemplate(),
				template:
					supportsTemplateMode && isViewable && canEditTemplate
						? getEditedPostTemplate()
						: null,
				post: postObject,
			};
		},
		[ postType, postId ]
	);

	const { updatePreferredStyleVariations, setIsInserterOpened } =
		useDispatch( editPostStore );

	const editorSettings = useMemo( () => {
		const result = {
			...settings,
			__experimentalPreferredStyleVariations: {
				value: preferredStyleVariations,
				onChange: updatePreferredStyleVariations,
			},
			hasFixedToolbar,
			focusMode,
			isDistractionFree,
			hasInlineToolbar,

			// This is marked as experimental to give time for the quick inserter to mature.
			__experimentalSetIsInserterOpened: setIsInserterOpened,
			keepCaretInsideBlock,
			// Keep a reference of the `allowedBlockTypes` from the server to handle use cases
			// where we need to differentiate if a block is disabled by the user or some plugin.
			defaultAllowedBlockTypes: settings.allowedBlockTypes,
		};

		// Omit hidden block types if exists and non-empty.
		if ( hiddenBlockTypes.length > 0 ) {
			// Defer to passed setting for `allowedBlockTypes` if provided as
			// anything other than `true` (where `true` is equivalent to allow
			// all block types).
			const defaultAllowedBlockTypes =
				true === settings.allowedBlockTypes
					? blockTypes.map( ( { name } ) => name )
					: settings.allowedBlockTypes || [];

			result.allowedBlockTypes = defaultAllowedBlockTypes.filter(
				( type ) => ! hiddenBlockTypes.includes( type )
			);
		}

		return result;
	}, [
		settings,
		hasFixedToolbar,
		hasInlineToolbar,
		focusMode,
		isDistractionFree,
		hiddenBlockTypes,
		blockTypes,
		preferredStyleVariations,
		setIsInserterOpened,
		updatePreferredStyleVariations,
		keepCaretInsideBlock,
	] );

	const styles = useMemo( () => {
		const themeStyles = [];
		const presetStyles = [];
		settings.styles?.forEach( ( style ) => {
			if ( ! style.__unstableType || style.__unstableType === 'theme' ) {
				themeStyles.push( style );
			} else {
				presetStyles.push( style );
			}
		} );

		const defaultEditorStyles = [
			...settings.defaultEditorStyles,
			...presetStyles,
		];

		// If theme styles are not present or displayed, ensure that
		// base layout styles are still present in the editor.
		if (
			! settings.disableLayoutStyles &&
			! ( hasThemeStyles && themeStyles.length )
		) {
			defaultEditorStyles.push( {
				css: getLayoutStyles( {
					style: {},
					selector: 'body',
					hasBlockGapSupport: false,
					hasFallbackGapSupport: true,
					fallbackGapValue: '0.5em',
				} ),
			} );
		}

		return hasThemeStyles && themeStyles.length
			? settings.styles
			: defaultEditorStyles;
	}, [ settings, hasThemeStyles ] );

	if ( ! post ) {
		return null;
	}

	return (
		<ShortcutProvider>
			<SlotFillProvider>
				<ExperimentalEditorProvider
					settings={ editorSettings }
					post={ post }
					initialEdits={ initialEdits }
					useSubRegistry={ false }
					__unstableTemplate={ isTemplateMode ? template : undefined }
					{ ...props }
				>
					<ErrorBoundary>
						<CommandMenu />
						<EditorInitialization postId={ postId } />
						<Layout styles={ styles } />
					</ErrorBoundary>
					<PostLockedModal />
				</ExperimentalEditorProvider>
			</SlotFillProvider>
		</ShortcutProvider>
	);
}

export default Editor;
