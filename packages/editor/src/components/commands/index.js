/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { __, isRTL } from '@wordpress/i18n';
import {
	blockDefault,
	code,
	drawerLeft,
	drawerRight,
	edit,
	formatListBullets,
	listView,
	external,
	keyboard,
	symbol,
} from '@wordpress/icons';
import { useCommandLoader } from '@wordpress/commands';
import { store as preferencesStore } from '@wordpress/preferences';
import { store as noticesStore } from '@wordpress/notices';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { store as interfaceStore } from '@wordpress/interface';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { PATTERN_POST_TYPE } from '../../store/constants';
import { modalName as patternRenameModalName } from '../pattern-rename-modal';
import { modalName as patternDuplicateModalName } from '../pattern-duplicate-modal';

function useEditorCommandLoader() {
	const {
		editorMode,
		isListViewOpen,
		showBlockBreadcrumbs,
		isDistractionFree,
		isTopToolbar,
		isFocusMode,
		isPreviewMode,
		isViewable,
		isCodeEditingEnabled,
		isRichEditingEnabled,
		isPublishSidebarEnabled,
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
			isTopToolbar: get( 'core', 'fixedToolbar' ),
			isPreviewMode: getSettings().__unstableIsPreviewMode,
			isViewable: getPostType( getCurrentPostType() )?.viewable ?? false,
			isCodeEditingEnabled: getEditorSettings().codeEditingEnabled,
			isRichEditingEnabled: getEditorSettings().richEditingEnabled,
			isPublishSidebarEnabled:
				select( editorStore ).isPublishSidebarEnabled(),
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
	} = useDispatch( editorStore );
	const { openModal, enableComplementaryArea, disableComplementaryArea } =
		useDispatch( interfaceStore );
	const { getCurrentPostId } = useSelect( editorStore );
	const allowSwitchEditorMode = isCodeEditingEnabled && isRichEditingEnabled;

	if ( isPreviewMode ) {
		return { commands: [], isLoading: false };
	}

	const commands = [];

	commands.push( {
		name: 'core/open-shortcut-help',
		label: __( 'Keyboard shortcuts' ),
		icon: keyboard,
		callback: ( { close } ) => {
			close();
			openModal( 'editor/keyboard-shortcut-help' );
		},
	} );

	commands.push( {
		name: 'core/toggle-distraction-free',
		label: isDistractionFree
			? __( 'Exit Distraction Free' )
			: __( 'Enter Distraction Free' ),
		callback: ( { close } ) => {
			toggleDistractionFree();
			close();
		},
	} );

	commands.push( {
		name: 'core/open-preferences',
		label: __( 'Editor preferences' ),
		callback: ( { close } ) => {
			close();
			openModal( 'editor/preferences' );
		},
	} );

	commands.push( {
		name: 'core/toggle-spotlight-mode',
		label: __( 'Toggle spotlight' ),
		callback: ( { close } ) => {
			toggle( 'core', 'focusMode' );
			close();
			createInfoNotice(
				isFocusMode ? __( 'Spotlight off.' ) : __( 'Spotlight on.' ),
				{
					id: 'core/editor/toggle-spotlight-mode/notice',
					type: 'snackbar',
					actions: [
						{
							label: __( 'Undo' ),
							onClick: () => {
								toggle( 'core', 'focusMode' );
							},
						},
					],
				}
			);
		},
	} );

	commands.push( {
		name: 'core/toggle-list-view',
		label: isListViewOpen
			? __( 'Close List View' )
			: __( 'Open List View' ),
		icon: listView,
		callback: ( { close } ) => {
			setIsListViewOpened( ! isListViewOpen );
			close();
			createInfoNotice(
				isListViewOpen ? __( 'List View off.' ) : __( 'List View on.' ),
				{
					id: 'core/editor/toggle-list-view/notice',
					type: 'snackbar',
				}
			);
		},
	} );

	commands.push( {
		name: 'core/toggle-top-toolbar',
		label: __( 'Toggle top toolbar' ),
		callback: ( { close } ) => {
			toggle( 'core', 'fixedToolbar' );
			if ( isDistractionFree ) {
				toggleDistractionFree();
			}
			close();
			createInfoNotice(
				isTopToolbar
					? __( 'Top toolbar off.' )
					: __( 'Top toolbar on.' ),
				{
					id: 'core/editor/toggle-top-toolbar/notice',
					type: 'snackbar',
					actions: [
						{
							label: __( 'Undo' ),
							onClick: () => {
								toggle( 'core', 'fixedToolbar' );
							},
						},
					],
				}
			);
		},
	} );

	if ( allowSwitchEditorMode ) {
		commands.push( {
			name: 'core/toggle-code-editor',
			label:
				editorMode === 'visual'
					? __( 'Open code editor' )
					: __( 'Exit code editor' ),
			icon: code,
			callback: ( { close } ) => {
				switchEditorMode( editorMode === 'visual' ? 'text' : 'visual' );
				close();
			},
		} );
	}

	commands.push( {
		name: 'core/toggle-breadcrumbs',
		label: showBlockBreadcrumbs
			? __( 'Hide block breadcrumbs' )
			: __( 'Show block breadcrumbs' ),
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
		label: __( 'Toggle settings sidebar' ),
		icon: isRTL() ? drawerLeft : drawerRight,
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
		label: __( 'Toggle block inspector' ),
		icon: blockDefault,
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
}

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
			icon: edit,
			callback: ( { close } ) => {
				openModal( patternRenameModalName );
				close();
			},
		} );
		commands.push( {
			name: 'core/duplicate-pattern',
			label: __( 'Duplicate pattern' ),
			icon: symbol,
			callback: ( { close } ) => {
				openModal( patternDuplicateModalName );
				close();
			},
		} );
	}

	return { isLoading: false, commands };
}

export default function useCommands() {
	useCommandLoader( {
		name: 'core/editor/edit-ui',
		hook: useEditorCommandLoader,
	} );

	useCommandLoader( {
		name: 'core/editor/contextual-commands',
		hook: useEditedEntityContextualCommands,
		context: 'entity-edit',
	} );
}
