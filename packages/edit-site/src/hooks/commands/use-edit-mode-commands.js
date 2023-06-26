/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { __, isRTL } from '@wordpress/i18n';
import {
	code,
	cog,
	trash,
	backup,
	layout,
	page,
	drawerLeft,
	drawerRight,
	blockDefault,
} from '@wordpress/icons';
import { useCommandLoader } from '@wordpress/commands';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { store as preferencesStore } from '@wordpress/preferences';
import { store as interfaceStore } from '@wordpress/interface';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import useEditedEntityRecord from '../../components/use-edited-entity-record';
import isTemplateRemovable from '../../utils/is-template-removable';
import isTemplateRevertable from '../../utils/is-template-revertable';
import { unlock } from '../../lock-unlock';

const { useHistory } = unlock( routerPrivateApis );

function usePageContentFocusCommands() {
	const { isPage, canvasMode, hasPageContentFocus } = useSelect(
		( select ) => ( {
			isPage: select( editSiteStore ).isPage(),
			canvasMode: unlock( select( editSiteStore ) ).getCanvasMode(),
			hasPageContentFocus: select( editSiteStore ).hasPageContentFocus(),
		} ),
		[]
	);
	const { setHasPageContentFocus } = useDispatch( editSiteStore );

	if ( ! isPage || canvasMode !== 'edit' ) {
		return { isLoading: false, commands: [] };
	}

	const commands = [];

	if ( hasPageContentFocus ) {
		commands.push( {
			name: 'core/switch-to-template-focus',
			label: __( 'Edit template' ),
			icon: layout,
			callback: ( { close } ) => {
				setHasPageContentFocus( false );
				close();
			},
		} );
	} else {
		commands.push( {
			name: 'core/switch-to-page-focus',
			label: __( 'Back to page' ),
			icon: page,
			callback: ( { close } ) => {
				setHasPageContentFocus( true );
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
	const hasPageContentFocus = useSelect(
		( select ) => select( editSiteStore ).hasPageContentFocus(),
		[]
	);

	if ( ! isLoaded ) {
		return { isLoading: true, commands: [] };
	}

	const commands = [];

	if ( isTemplateRevertable( template ) && ! hasPageContentFocus ) {
		const label =
			template.type === 'wp_template'
				? __( 'Reset template' )
				: __( 'Reset template part' );
		commands.push( {
			name: 'core/reset-template',
			label,
			icon: backup,
			callback: ( { close } ) => {
				revertTemplate( template );
				close();
			},
		} );
	}

	if ( isTemplateRemovable( template ) && ! hasPageContentFocus ) {
		const label =
			template.type === 'wp_template'
				? __( 'Delete template' )
				: __( 'Delete template part' );
		commands.push( {
			name: 'core/remove-template',
			label,
			icon: trash,
			callback: ( { close } ) => {
				removeTemplate( template );
				// Navigate to the template list
				history.push( {
					path: '/' + template.type,
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
	const { openGeneralSidebar, closeGeneralSidebar, switchEditorMode } =
		useDispatch( editSiteStore );
	const { canvasMode, editorMode, activeSidebar } = useSelect(
		( select ) => ( {
			canvasMode: unlock( select( editSiteStore ) ).getCanvasMode(),
			editorMode: select( editSiteStore ).getEditorMode(),
			activeSidebar: select( interfaceStore ).getActiveComplementaryArea(
				editSiteStore.name
			),
		} ),
		[]
	);
	const { toggle } = useDispatch( preferencesStore );

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
		name: 'core/toggle-distraction-free-mode',
		label: __( 'Toggle spotlight mode' ),
		icon: cog,
		callback: ( { close } ) => {
			toggle( 'core/edit-site', 'focusMode' );
			close();
		},
	} );

	commands.push( {
		name: 'core/toggle-top-toolbar',
		label: __( 'Toggle top toolbar' ),
		icon: cog,
		callback: ( { close } ) => {
			toggle( 'core/edit-site', 'fixedToolbar' );
			close();
		},
	} );

	commands.push( {
		name: 'core/toggle-code-editor',
		label: __( 'Toggle code editor' ),
		icon: code,
		callback: ( { close } ) => {
			switchEditorMode( editorMode === 'visual' ? 'text' : 'visual' );
			close();
		},
	} );

	return {
		isLoading: false,
		commands,
	};
}

export function useEditModeCommands() {
	useCommandLoader( {
		name: 'core/edit-site/page-content-focus',
		hook: usePageContentFocusCommands,
		context: 'site-editor-edit',
	} );

	useCommandLoader( {
		name: 'core/edit-site/manipulate-document',
		hook: useManipulateDocumentCommands,
		context: 'site-editor-edit',
	} );

	useCommandLoader( {
		name: 'core/edit-site/edit-ui',
		hook: useEditUICommands,
	} );
}
