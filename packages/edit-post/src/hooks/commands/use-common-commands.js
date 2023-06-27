/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { __, isRTL } from '@wordpress/i18n';
import {
	code,
	cog,
	drawerLeft,
	drawerRight,
	blockDefault,
} from '@wordpress/icons';
import { useCommand } from '@wordpress/commands';
import { store as preferencesStore } from '@wordpress/preferences';
import { store as interfaceStore } from '@wordpress/interface';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../store';

export default function useCommonCommands() {
	const { openGeneralSidebar, closeGeneralSidebar, switchEditorMode } =
		useDispatch( editPostStore );
	const { editorMode, activeSidebar } = useSelect(
		( select ) => ( {
			activeSidebar: select( interfaceStore ).getActiveComplementaryArea(
				editPostStore.name
			),
			editorMode: select( editPostStore ).getEditorMode(),
		} ),
		[]
	);
	const { toggle } = useDispatch( preferencesStore );

	useCommand( {
		name: 'core/open-settings-sidebar',
		label: __( 'Toggle settings sidebar' ),
		icon: isRTL() ? drawerLeft : drawerRight,
		callback: ( { close } ) => {
			close();
			if ( activeSidebar === 'edit-post/document' ) {
				closeGeneralSidebar();
			} else {
				openGeneralSidebar( 'edit-post/document' );
			}
		},
	} );

	useCommand( {
		name: 'core/open-block-inspector',
		label: __( 'Toggle block inspector' ),
		icon: blockDefault,
		callback: ( { close } ) => {
			close();
			if ( activeSidebar === 'edit-post/block' ) {
				closeGeneralSidebar();
			} else {
				openGeneralSidebar( 'edit-post/block' );
			}
		},
	} );

	useCommand( {
		name: 'core/toggle-distraction-free',
		label: __( 'Toggle distraction free' ),
		icon: cog,
		callback: ( { close } ) => {
			toggle( 'core/edit-post', 'distractionFree' );
			close();
		},
	} );

	useCommand( {
		name: 'core/toggle-spotlight-mode',
		label: __( 'Toggle spotlight mode' ),
		icon: cog,
		callback: ( { close } ) => {
			toggle( 'core/edit-post', 'focusMode' );
			close();
		},
	} );

	useCommand( {
		name: 'core/toggle-top-toolbar',
		label: __( 'Toggle top toolbar' ),
		icon: cog,
		callback: ( { close } ) => {
			toggle( 'core/edit-post', 'fixedToolbar' );
			close();
		},
	} );

	useCommand( {
		name: 'core/toggle-code-editor',
		label: __( 'Toggle code editor' ),
		icon: code,
		callback: ( { close } ) => {
			switchEditorMode( editorMode === 'visual' ? 'text' : 'visual' );
			close();
		},
	} );
}
