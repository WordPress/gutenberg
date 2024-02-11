/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { __, sprintf, isRTL } from '@wordpress/i18n';
import {
	edit,
	trash,
	rotateLeft,
	rotateRight,
	layout,
	page,
	drawerLeft,
	drawerRight,
	blockDefault,
	code,
	keyboard,
	listView,
	symbol,
} from '@wordpress/icons';
import { useCommandLoader } from '@wordpress/commands';
import { decodeEntities } from '@wordpress/html-entities';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { store as preferencesStore } from '@wordpress/preferences';
import { store as interfaceStore } from '@wordpress/interface';
import { store as noticesStore } from '@wordpress/notices';
import { store as editorStore } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import useEditedEntityRecord from '../../components/use-edited-entity-record';
import isTemplateRemovable from '../../utils/is-template-removable';
import isTemplateRevertable from '../../utils/is-template-revertable';
import { KEYBOARD_SHORTCUT_HELP_MODAL_NAME } from '../../components/keyboard-shortcut-help-modal';
import { PREFERENCES_MODAL_NAME } from '../../components/preferences-modal';
import { PATTERN_MODALS } from '../../components/pattern-modal';
import { unlock } from '../../lock-unlock';
import { TEMPLATE_POST_TYPE } from '../../utils/constants';
import { useLink } from '../../components/routes/link';

const { useHistory } = unlock( routerPrivateApis );

function usePageContentFocusCommands() {
	const { record: template } = useEditedEntityRecord();
	const { isPage, canvasMode, templateId, currentPostType } = useSelect(
		( select ) => {
			const { isPage: _isPage, getCanvasMode } = unlock(
				select( editSiteStore )
			);
			const { getCurrentPostType, getCurrentTemplateId } =
				select( editorStore );
			return {
				isPage: _isPage(),
				canvasMode: getCanvasMode(),
				templateId: getCurrentTemplateId(),
				currentPostType: getCurrentPostType(),
			};
		},
		[]
	);

	const { onClick: editTemplate } = useLink( {
		postType: 'wp_template',
		postId: templateId,
	} );

	const { setRenderingMode } = useDispatch( editorStore );

	if ( ! isPage || canvasMode !== 'edit' ) {
		return { isLoading: false, commands: [] };
	}

	const commands = [];

	if ( currentPostType !== 'wp_template' ) {
		commands.push( {
			name: 'core/switch-to-template-focus',
			/* translators: %1$s: template title */
			label: sprintf(
				'Edit template: %s',
				decodeEntities( template.title )
			),
			icon: layout,
			callback: ( { close } ) => {
				editTemplate();
				close();
			},
		} );
	} else {
		commands.push( {
			name: 'core/switch-to-page-focus',
			label: __( 'Back to page' ),
			icon: page,
			callback: ( { close } ) => {
				setRenderingMode( 'template-locked' );
				close();
			},
		} );
	}

	return { isLoading: false, commands };
}

function useEditorModeCommands() {
	const { switchEditorMode } = useDispatch( editSiteStore );
	const { canvasMode, editorMode } = useSelect(
		( select ) => ( {
			canvasMode: unlock( select( editSiteStore ) ).getCanvasMode(),
			editorMode: select( editSiteStore ).getEditorMode(),
		} ),
		[]
	);

	if ( canvasMode !== 'edit' || editorMode !== 'text' ) {
		return { isLoading: false, commands: [] };
	}

	const commands = [];

	if ( editorMode === 'text' ) {
		commands.push( {
			name: 'core/exit-code-editor',
			label: __( 'Exit code editor' ),
			icon: code,
			callback: ( { close } ) => {
				switchEditorMode( 'visual' );
				close();
			},
		} );
	}

	return { isLoading: false, commands };
}

function useManipulateDocumentCommands() {
	const { isLoaded, record: template } = useEditedEntityRecord();
	const { removeTemplate, revertTemplate } = useDispatch( editSiteStore );
	const history = useHistory();
	const isEditingPage = useSelect(
		( select ) =>
			select( editSiteStore ).isPage() &&
			select( editorStore ).getCurrentPostType() !== 'wp_template',
		[]
	);

	if ( ! isLoaded ) {
		return { isLoading: true, commands: [] };
	}

	const commands = [];

	if ( isTemplateRevertable( template ) && ! isEditingPage ) {
		const label =
			template.type === TEMPLATE_POST_TYPE
				? /* translators: %1$s: template title */
				  sprintf(
						'Reset template: %s',
						decodeEntities( template.title )
				  )
				: /* translators: %1$s: template part title */
				  sprintf(
						'Reset template part: %s',
						decodeEntities( template.title )
				  );
		commands.push( {
			name: 'core/reset-template',
			label,
			icon: isRTL() ? rotateRight : rotateLeft,
			callback: ( { close } ) => {
				revertTemplate( template );
				close();
			},
		} );
	}

	if ( isTemplateRemovable( template ) && ! isEditingPage ) {
		const label =
			template.type === TEMPLATE_POST_TYPE
				? /* translators: %1$s: template title */
				  sprintf(
						'Delete template: %s',
						decodeEntities( template.title )
				  )
				: /* translators: %1$s: template part title */
				  sprintf(
						'Delete template part: %s',
						decodeEntities( template.title )
				  );
		const path =
			template.type === TEMPLATE_POST_TYPE
				? '/wp_template'
				: '/wp_template_part/all';
		commands.push( {
			name: 'core/remove-template',
			label,
			icon: trash,
			callback: ( { close } ) => {
				removeTemplate( template );
				// Navigate to the template list
				history.push( {
					path,
				} );
				close();
			},
		} );
	}

	return {
		isLoading: ! isLoaded,
		commands,
	};
}

function useEditUICommands() {
	const {
		openGeneralSidebar,
		closeGeneralSidebar,
		toggleDistractionFree,
		setIsListViewOpened,
		switchEditorMode,
	} = useDispatch( editSiteStore );
	const {
		canvasMode,
		editorMode,
		activeSidebar,
		showBlockBreadcrumbs,
		isListViewOpen,
		isDistractionFree,
		isTopToolbar,
		isFocusMode,
	} = useSelect( ( select ) => {
		const { get } = select( preferencesStore );
		const { getEditorMode } = select( editSiteStore );
		const { isListViewOpened } = select( editorStore );
		return {
			canvasMode: unlock( select( editSiteStore ) ).getCanvasMode(),
			editorMode: getEditorMode(),
			activeSidebar: select( interfaceStore ).getActiveComplementaryArea(
				editSiteStore.name
			),
			showBlockBreadcrumbs: get( 'core', 'showBlockBreadcrumbs' ),
			isListViewOpen: isListViewOpened(),
			isDistractionFree: get( 'core', 'distractionFree' ),
			isFocusMode: get( 'core', 'focusMode' ),
			isTopToolbar: get( 'core', 'fixedToolbar' ),
		};
	}, [] );
	const { openModal } = useDispatch( interfaceStore );
	const { toggle } = useDispatch( preferencesStore );
	const { createInfoNotice } = useDispatch( noticesStore );

	if ( canvasMode !== 'edit' ) {
		return { isLoading: false, commands: [] };
	}

	const commands = [];

	commands.push( {
		name: 'core/open-settings-sidebar',
		label: __( 'Toggle settings sidebar' ),
		icon: isRTL() ? drawerLeft : drawerRight,
		callback: ( { close } ) => {
			close();
			if ( activeSidebar === 'edit-site/template' ) {
				closeGeneralSidebar();
			} else {
				openGeneralSidebar( 'edit-site/template' );
			}
		},
	} );

	commands.push( {
		name: 'core/open-block-inspector',
		label: __( 'Toggle block inspector' ),
		icon: blockDefault,
		callback: ( { close } ) => {
			close();
			if ( activeSidebar === 'edit-site/block-inspector' ) {
				closeGeneralSidebar();
			} else {
				openGeneralSidebar( 'edit-site/block-inspector' );
			}
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
					id: 'core/edit-site/toggle-spotlight-mode/notice',
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
		name: 'core/toggle-distraction-free',
		label: isDistractionFree
			? __( 'Exit Distraction Free' )
			: __( 'Enter Distraction Free ' ),
		callback: ( { close } ) => {
			toggleDistractionFree();
			close();
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
					id: 'core/edit-site/toggle-top-toolbar/notice',
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

	if ( editorMode === 'visual' ) {
		commands.push( {
			name: 'core/toggle-code-editor',
			label: __( 'Open code editor' ),
			icon: code,
			callback: ( { close } ) => {
				switchEditorMode( 'text' );
				close();
			},
		} );
	}

	commands.push( {
		name: 'core/open-preferences',
		label: __( 'Editor preferences' ),
		callback: () => {
			openModal( PREFERENCES_MODAL_NAME );
		},
	} );

	commands.push( {
		name: 'core/open-shortcut-help',
		label: __( 'Keyboard shortcuts' ),
		icon: keyboard,
		callback: () => {
			openModal( KEYBOARD_SHORTCUT_HELP_MODAL_NAME );
		},
	} );

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
					id: 'core/edit-site/toggle-breadcrumbs/notice',
					type: 'snackbar',
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
					id: 'core/edit-site/toggle-list-view/notice',
					type: 'snackbar',
				}
			);
		},
	} );

	return {
		isLoading: false,
		commands,
	};
}

function usePatternCommands() {
	const { isLoaded, record: pattern } = useEditedEntityRecord();
	const { openModal } = useDispatch( interfaceStore );

	if ( ! isLoaded ) {
		return { isLoading: true, commands: [] };
	}

	const commands = [];

	if ( pattern?.type === 'wp_block' ) {
		commands.push( {
			name: 'core/rename-pattern',
			label: __( 'Rename pattern' ),
			icon: edit,
			callback: ( { close } ) => {
				openModal( PATTERN_MODALS.rename );
				close();
			},
		} );
		commands.push( {
			name: 'core/duplicate-pattern',
			label: __( 'Duplicate pattern' ),
			icon: symbol,
			callback: ( { close } ) => {
				openModal( PATTERN_MODALS.duplicate );
				close();
			},
		} );
	}

	return { isLoading: false, commands };
}

export function useEditModeCommands() {
	useCommandLoader( {
		name: 'core/exit-code-editor',
		hook: useEditorModeCommands,
		context: 'site-editor-edit',
	} );

	useCommandLoader( {
		name: 'core/edit-site/page-content-focus',
		hook: usePageContentFocusCommands,
		context: 'site-editor-edit',
	} );

	useCommandLoader( {
		name: 'core/edit-site/manipulate-document',
		hook: useManipulateDocumentCommands,
	} );

	useCommandLoader( {
		name: 'core/edit-site/patterns',
		hook: usePatternCommands,
		context: 'site-editor-edit',
	} );

	useCommandLoader( {
		name: 'core/edit-site/edit-ui',
		hook: useEditUICommands,
	} );
}
