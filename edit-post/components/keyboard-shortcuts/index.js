/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { KeyboardShortcuts } from '@wordpress/components';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import shortcuts from '../../keyboard-shortcuts';

class EditorModeKeyboardShortcuts extends Component {
	constructor() {
		super( ...arguments );

		this.toggleMode = this.toggleMode.bind( this );
		this.toggleSidebar = this.toggleSidebar.bind( this );
	}

	toggleMode() {
		const { mode, switchMode } = this.props;
		switchMode( mode === 'visual' ? 'text' : 'visual' );
	}

	toggleSidebar( event ) {
		event.preventDefault();

		const { areAdvancedSettingsOpened, closeSidebar, openSidebar } = this.props;
		if ( areAdvancedSettingsOpened ) {
			closeSidebar();
		} else {
			openSidebar();
		}
	}

	render() {
		return (
			<KeyboardShortcuts
				bindGlobal
				shortcuts={ {
					[ shortcuts.toggleEditorMode.value ]: this.toggleMode,
					[ shortcuts.toggleSidebar.value ]: this.toggleSidebar,
				} }
			/>
		);
	}
}

export default compose( [
	withSelect( ( select ) => ( {
		mode: select( 'core/edit-post' ).getEditorMode(),
		areAdvancedSettingsOpened: select( 'core/edit-post' ).getActiveGeneralSidebarName() === 'edit-post/block',
	} ) ),
	withDispatch( ( dispatch ) => ( {
		switchMode: ( mode ) => {
			dispatch( 'core/edit-post' ).switchEditorMode( mode );
		},
		openSidebar: () => dispatch( 'core/edit-post' ).openGeneralSidebar( 'edit-post/block' ),
		closeSidebar: dispatch( 'core/edit-post' ).closeGeneralSidebar,
	} ) ),
] )( EditorModeKeyboardShortcuts );
