/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { code, listView, external, keyboard } from '@wordpress/icons';
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
		};
	}, [] );
	const { toggle } = useDispatch( preferencesStore );
	const { createInfoNotice } = useDispatch( noticesStore );
	const {
		__unstableSaveForPreview,
		setIsListViewOpened,
		switchEditorMode,
		toggleDistractionFree,
	} = useDispatch( editorStore );
	const { openModal } = useDispatch( interfaceStore );
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
		callback: () => {
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
		callback: () => {
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

export default function useCommands() {
	useCommandLoader( {
		name: 'core/editor/edit-ui',
		hook: useEditorCommandLoader,
	} );
}
