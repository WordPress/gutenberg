/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { __, isRTL, sprintf } from '@wordpress/i18n';
import {
	blockDefault,
	code,
	drawerLeft,
	drawerRight,
	pencil,
	formatListBullets,
	listView,
	external,
	keyboard,
	symbol,
	page,
	layout,
	rotateRight,
	rotateLeft,
} from '@wordpress/icons';
import { useCommandLoader } from '@wordpress/commands';
import { store as preferencesStore } from '@wordpress/preferences';
import { store as noticesStore } from '@wordpress/notices';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore, useEntityRecord } from '@wordpress/core-data';
import { store as interfaceStore } from '@wordpress/interface';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { store as editorStore } from '../../store';
import {
	PATTERN_POST_TYPE,
	TEMPLATE_PART_POST_TYPE,
	TEMPLATE_POST_TYPE,
} from '../../store/constants';
import { modalName as patternRenameModalName } from '../pattern-rename-modal';
import { modalName as patternDuplicateModalName } from '../pattern-duplicate-modal';
import isTemplateRevertable from '../../store/utils/is-template-revertable';

/**
 * Returns the command that toggles content-only editing for patterns and template parts.
 * The command is registered both globally for search and contextually for block
 * selection, so keeping it in one place ensures the label and callback stay aligned.
 *
 * @param {Object}   options                                               Command options.
 * @param {boolean}  options.disableContentOnlyForPatternsAndTemplateParts Whether content-only editing is disabled for patterns and template parts.
 * @param {Function} options.stopEditingContentOnlySection                 Stops editing the current content-only section before changing the setting.
 * @param {Function} options.updateEditorSettings                          Updates the editor settings.
 * @return {Object} The command configuration.
 */
function getTogglePatternEditingCommand( {
	disableContentOnlyForPatternsAndTemplateParts,
	stopEditingContentOnlySection,
	updateEditorSettings,
} ) {
	return {
		name: 'core/toggle-pattern-editing',
		label: disableContentOnlyForPatternsAndTemplateParts
			? __( 'Disable editing all patterns' )
			: __( 'Enable editing all patterns' ),
		icon: symbol,
		category: 'command',
		callback: ( { close } ) => {
			const disableContentOnly =
				! disableContentOnlyForPatternsAndTemplateParts;
			stopEditingContentOnlySection();
			updateEditorSettings( {
				disableContentOnlyForUnsyncedPatterns: disableContentOnly,
				disableContentOnlyForTemplateParts: disableContentOnly,
			} );
			close();
		},
	};
}

function isPatternOrTemplatePartBlock( blockName, attributes ) {
	return (
		!! attributes?.metadata?.patternName ||
		blockName === 'core/template-part'
	);
}

const getEditorCommandLoader = () =>
	function useEditorCommandLoader() {
		const {
			editorMode,
			isListViewOpen,
			showBlockBreadcrumbs,
			isDistractionFree,
			isFocusMode,
			isPreviewMode,
			isViewable,
			isCodeEditingEnabled,
			isRichEditingEnabled,
			isPublishSidebarEnabled,
			disableContentOnlyForUnsyncedPatterns,
			disableContentOnlyForTemplateParts,
		} = useSelect( ( select ) => {
			const { get } = select( preferencesStore );
			const { isListViewOpened, getCurrentPostType, getEditorSettings } =
				select( editorStore );
			const { getSettings } = select( blockEditorStore );
			const { getPostType } = select( coreStore );

			return {
				editorMode: get( 'core', 'editorMode' ) ?? 'visual',
				isListViewOpen: isListViewOpened(),
				showBlockBreadcrumbs: get( 'core', 'showBlockBreadcrumbs' ),
				isDistractionFree: get( 'core', 'distractionFree' ),
				isFocusMode: get( 'core', 'focusMode' ),
				isPreviewMode: getSettings().isPreviewMode,
				isViewable:
					getPostType( getCurrentPostType() )?.viewable ?? false,
				isCodeEditingEnabled: getEditorSettings().codeEditingEnabled,
				isRichEditingEnabled: getEditorSettings().richEditingEnabled,
				isPublishSidebarEnabled:
					select( editorStore ).isPublishSidebarEnabled(),
				disableContentOnlyForUnsyncedPatterns:
					!! getEditorSettings()
						.disableContentOnlyForUnsyncedPatterns,
				disableContentOnlyForTemplateParts:
					!! getEditorSettings().disableContentOnlyForTemplateParts,
			};
		}, [] );
		const { getActiveComplementaryArea } = useSelect( interfaceStore );
		const { toggle } = useDispatch( preferencesStore );
		const { createInfoNotice } = useDispatch( noticesStore );
		const {
			__unstableSaveForPreview,
			setIsListViewOpened,
			switchEditorMode,
			toggleDistractionFree,
			toggleSpotlightMode,
			toggleTopToolbar,
			updateEditorSettings,
		} = useDispatch( editorStore );
		// eslint-disable-next-line @wordpress/no-unused-vars-before-return
		const { stopEditingContentOnlySection } = unlock(
			useDispatch( blockEditorStore )
		);
		const { openModal, enableComplementaryArea, disableComplementaryArea } =
			useDispatch( interfaceStore );
		const { getCurrentPostId } = useSelect( editorStore );
		const allowSwitchEditorMode =
			isCodeEditingEnabled && isRichEditingEnabled;

		if ( isPreviewMode ) {
			return { commands: [], isLoading: false };
		}

		const commands = [];
		const disableContentOnlyForPatternsAndTemplateParts =
			disableContentOnlyForUnsyncedPatterns &&
			disableContentOnlyForTemplateParts;

		commands.push( {
			name: 'core/open-shortcut-help',
			label: __( 'Keyboard shortcuts' ),
			icon: keyboard,
			category: 'view',
			callback: ( { close } ) => {
				close();
				openModal( 'editor/keyboard-shortcut-help' );
			},
		} );

		commands.push( {
			name: 'core/toggle-distraction-free',
			label: isDistractionFree
				? __( 'Exit Distraction free' )
				: __( 'Enter Distraction free' ),
			category: 'command',
			callback: ( { close } ) => {
				toggleDistractionFree();
				close();
			},
		} );

		commands.push( {
			name: 'core/open-preferences',
			label: __( 'Editor preferences' ),
			category: 'view',
			callback: ( { close } ) => {
				close();
				openModal( 'editor/preferences' );
			},
		} );

		commands.push( {
			name: 'core/toggle-spotlight-mode',
			label: isFocusMode
				? __( 'Exit Spotlight mode' )
				: __( 'Enter Spotlight mode' ),
			category: 'command',
			callback: ( { close } ) => {
				toggleSpotlightMode();
				close();
			},
		} );

		commands.push( {
			name: 'core/toggle-list-view',
			label: isListViewOpen
				? __( 'Close List View' )
				: __( 'Open List View' ),
			icon: listView,
			category: 'command',
			callback: ( { close } ) => {
				setIsListViewOpened( ! isListViewOpen );
				close();
				createInfoNotice(
					isListViewOpen
						? __( 'List View off.' )
						: __( 'List View on.' ),
					{
						id: 'core/editor/toggle-list-view/notice',
						type: 'snackbar',
					}
				);
			},
		} );

		commands.push( {
			name: 'core/toggle-top-toolbar',
			label: __( 'Top toolbar' ),
			category: 'command',
			callback: ( { close } ) => {
				toggleTopToolbar();
				close();
			},
		} );

		commands.push(
			getTogglePatternEditingCommand( {
				disableContentOnlyForPatternsAndTemplateParts,
				stopEditingContentOnlySection,
				updateEditorSettings,
			} )
		);

		if ( allowSwitchEditorMode ) {
			commands.push( {
				name: 'core/toggle-code-editor',
				label:
					editorMode === 'visual'
						? __( 'Open code editor' )
						: __( 'Exit code editor' ),
				icon: code,
				category: 'command',
				callback: ( { close } ) => {
					switchEditorMode(
						editorMode === 'visual' ? 'text' : 'visual'
					);
					close();
				},
			} );
		}

		commands.push( {
			name: 'core/toggle-breadcrumbs',
			label: showBlockBreadcrumbs
				? __( 'Hide block breadcrumbs' )
				: __( 'Show block breadcrumbs' ),
			category: 'command',
			callback: ( { close } ) => {
				toggle( 'core', 'showBlockBreadcrumbs' );
				close();
				createInfoNotice(
					showBlockBreadcrumbs
						? __( 'Breadcrumbs hidden.' )
						: __( 'Breadcrumbs visible.' ),
					{
						id: 'core/editor/toggle-breadcrumbs/notice',
						type: 'snackbar',
					}
				);
			},
		} );

		commands.push( {
			name: 'core/open-settings-sidebar',
			label: __( 'Show or hide the Settings panel' ),
			icon: isRTL() ? drawerLeft : drawerRight,
			category: 'command',
			callback: ( { close } ) => {
				const activeSidebar = getActiveComplementaryArea( 'core' );
				close();
				if ( activeSidebar === 'edit-post/document' ) {
					disableComplementaryArea( 'core' );
				} else {
					enableComplementaryArea( 'core', 'edit-post/document' );
				}
			},
		} );

		commands.push( {
			name: 'core/open-block-inspector',
			label: __( 'Show or hide the Block settings panel' ),
			icon: blockDefault,
			category: 'command',
			callback: ( { close } ) => {
				const activeSidebar = getActiveComplementaryArea( 'core' );
				close();
				if ( activeSidebar === 'edit-post/block' ) {
					disableComplementaryArea( 'core' );
				} else {
					enableComplementaryArea( 'core', 'edit-post/block' );
				}
			},
		} );

		commands.push( {
			name: 'core/toggle-publish-sidebar',
			label: isPublishSidebarEnabled
				? __( 'Disable pre-publish checks' )
				: __( 'Enable pre-publish checks' ),
			icon: formatListBullets,
			category: 'command',
			callback: ( { close } ) => {
				close();
				toggle( 'core', 'isPublishSidebarEnabled' );
				createInfoNotice(
					isPublishSidebarEnabled
						? __( 'Pre-publish checks disabled.' )
						: __( 'Pre-publish checks enabled.' ),
					{
						id: 'core/editor/publish-sidebar/notice',
						type: 'snackbar',
					}
				);
			},
		} );

		if ( isViewable ) {
			commands.push( {
				name: 'core/preview-link',
				label: __( 'Preview in a new tab' ),
				icon: external,
				category: 'view',
				callback: async ( { close } ) => {
					close();
					const postId = getCurrentPostId();
					const link = await __unstableSaveForPreview();
					window.open( link, `wp-preview-${ postId }` );
				},
			} );
		}

		return {
			commands,
			isLoading: false,
		};
	};

const getPatternEditingContextualCommands = () =>
	function usePatternEditingContextualCommands( { search } ) {
		const {
			disableContentOnlyForPatternsAndTemplateParts,
			hasPatternOrTemplatePartSelection,
			isPreviewMode,
		} = useSelect( ( select ) => {
			const {
				getBlockAttributes,
				getBlockName,
				getBlockParents,
				getSelectedBlockClientId,
				getSelectedBlockClientIds,
				getSettings,
			} = select( blockEditorStore );
			const { getEditorSettings } = select( editorStore );
			const editorSettings = getEditorSettings();
			const selectedBlockClientId = getSelectedBlockClientId();
			const selectedBlockClientIds = getSelectedBlockClientIds();
			const clientIdsToCheck =
				selectedBlockClientId && selectedBlockClientIds.length === 1
					? [
							selectedBlockClientId,
							...getBlockParents( selectedBlockClientId, true ),
					  ]
					: [];

			return {
				disableContentOnlyForPatternsAndTemplateParts:
					!! editorSettings.disableContentOnlyForUnsyncedPatterns &&
					!! editorSettings.disableContentOnlyForTemplateParts,
				hasPatternOrTemplatePartSelection: clientIdsToCheck.some(
					( clientId ) =>
						isPatternOrTemplatePartBlock(
							getBlockName( clientId ),
							getBlockAttributes( clientId )
						)
				),
				isPreviewMode: getSettings().isPreviewMode,
			};
		}, [] );
		const { updateEditorSettings } = useDispatch( editorStore );
		// eslint-disable-next-line @wordpress/no-unused-vars-before-return
		const { stopEditingContentOnlySection } = unlock(
			useDispatch( blockEditorStore )
		);

		// Keep the disable command available after full pattern editing is enabled,
		// even when the current selection is no longer inside a pattern or template part.
		if (
			search ||
			( ! hasPatternOrTemplatePartSelection &&
				! disableContentOnlyForPatternsAndTemplateParts ) ||
			isPreviewMode
		) {
			return { isLoading: false, commands: [] };
		}

		return {
			isLoading: false,
			commands: [
				getTogglePatternEditingCommand( {
					disableContentOnlyForPatternsAndTemplateParts,
					stopEditingContentOnlySection,
					updateEditorSettings,
				} ),
			],
		};
	};

const getEditedEntityContextualCommands = () =>
	function useEditedEntityContextualCommands() {
		const { postType } = useSelect( ( select ) => {
			const { getCurrentPostType } = select( editorStore );
			return {
				postType: getCurrentPostType(),
			};
		}, [] );
		const { openModal } = useDispatch( interfaceStore );
		const commands = [];

		if ( postType === PATTERN_POST_TYPE ) {
			commands.push( {
				name: 'core/rename-pattern',
				label: __( 'Rename pattern' ),
				icon: pencil,
				category: 'edit',
				callback: ( { close } ) => {
					openModal( patternRenameModalName );
					close();
				},
			} );
			commands.push( {
				name: 'core/duplicate-pattern',
				label: __( 'Duplicate pattern' ),
				icon: symbol,
				category: 'command',
				callback: ( { close } ) => {
					openModal( patternDuplicateModalName );
					close();
				},
			} );
		}

		return { isLoading: false, commands };
	};

const getPageContentFocusCommands = () =>
	function usePageContentFocusCommands() {
		const {
			onNavigateToEntityRecord,
			goBack,
			templateId,
			isPreviewMode,
			canEditTemplate,
		} = useSelect( ( select ) => {
			const {
				getRenderingMode,
				getEditorSettings: _getEditorSettings,
				getCurrentTemplateId,
			} = unlock( select( editorStore ) );
			const editorSettings = _getEditorSettings();
			const _templateId = getCurrentTemplateId();
			return {
				isTemplateHidden: getRenderingMode() === 'post-only',
				onNavigateToEntityRecord:
					editorSettings.onNavigateToEntityRecord,
				getEditorSettings: _getEditorSettings,
				goBack: editorSettings.onNavigateToPreviousEntityRecord,
				templateId: _templateId,
				isPreviewMode: editorSettings.isPreviewMode,
				canEditTemplate:
					!! _templateId &&
					select( coreStore ).canUser( 'update', {
						kind: 'postType',
						name: 'wp_template',
						id: _templateId,
					} ),
			};
		}, [] );
		const { editedRecord: template, hasResolved } = useEntityRecord(
			'postType',
			'wp_template',
			templateId
		);

		if ( isPreviewMode ) {
			return { isLoading: false, commands: [] };
		}

		const commands = [];

		if ( templateId && hasResolved && canEditTemplate ) {
			commands.push( {
				name: 'core/switch-to-template-focus',
				label: sprintf(
					/* translators: %s: template title */
					__( 'Edit template: %s' ),
					decodeEntities( template.title )
				),
				icon: layout,
				category: 'edit',
				callback: ( { close } ) => {
					onNavigateToEntityRecord( {
						postId: templateId,
						postType: 'wp_template',
					} );
					close();
				},
			} );
		}

		if ( !! goBack ) {
			commands.push( {
				name: 'core/switch-to-previous-entity',
				label: __( 'Go back' ),
				icon: page,
				category: 'view',
				callback: ( { close } ) => {
					goBack();
					close();
				},
			} );
		}

		return { isLoading: false, commands };
	};

const getManipulateDocumentCommands = () =>
	function useManipulateDocumentCommands() {
		const { postType, postId } = useSelect( ( select ) => {
			const { getCurrentPostId, getCurrentPostType } =
				select( editorStore );
			return {
				postType: getCurrentPostType(),
				postId: getCurrentPostId(),
			};
		}, [] );
		const { editedRecord: template, hasResolved } = useEntityRecord(
			'postType',
			postType,
			postId
		);
		// eslint-disable-next-line @wordpress/no-unused-vars-before-return
		const { revertTemplate } = unlock( useDispatch( editorStore ) );

		if (
			! hasResolved ||
			! [ TEMPLATE_PART_POST_TYPE, TEMPLATE_POST_TYPE ].includes(
				postType
			)
		) {
			return { isLoading: true, commands: [] };
		}

		const commands = [];

		if ( isTemplateRevertable( template ) ) {
			const label =
				template.type === TEMPLATE_POST_TYPE
					? sprintf(
							/* translators: %s: template title */
							__( 'Reset template: %s' ),
							decodeEntities( template.title )
					  )
					: sprintf(
							/* translators: %s: template part title */
							__( 'Reset template part: %s' ),
							decodeEntities( template.title )
					  );
			commands.push( {
				name: 'core/reset-template',
				label,
				icon: isRTL() ? rotateRight : rotateLeft,
				category: 'command',
				callback: ( { close } ) => {
					revertTemplate( template );
					close();
				},
			} );
		}

		return {
			isLoading: ! hasResolved,
			commands,
		};
	};

export default function useCommands() {
	useCommandLoader( {
		name: 'core/editor/edit-ui',
		hook: getEditorCommandLoader(),
	} );

	useCommandLoader( {
		name: 'core/editor/contextual-commands',
		hook: getEditedEntityContextualCommands(),
		context: 'entity-edit',
	} );

	useCommandLoader( {
		name: 'core/editor/pattern-editing-contextual-commands',
		hook: getPatternEditingContextualCommands(),
		context: 'block-selection-edit',
	} );

	useCommandLoader( {
		name: 'core/editor/page-content-focus',
		hook: getPageContentFocusCommands(),
		context: 'entity-edit',
	} );

	useCommandLoader( {
		name: 'core/edit-site/manipulate-document',
		hook: getManipulateDocumentCommands(),
	} );
}
