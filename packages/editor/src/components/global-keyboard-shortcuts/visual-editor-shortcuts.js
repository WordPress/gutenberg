/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { KeyboardShortcuts } from '@wordpress/components';
import { withDispatch } from '@wordpress/data';
import { rawShortcut } from '@wordpress/keycodes';
import deprecated from '@wordpress/deprecated';
import { BlockEditorKeyboardShortcuts } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import SaveShortcut from './save-shortcut';

class VisualEditorGlobalKeyboardShortcuts extends Component {
	constructor() {
		super( ...arguments );
		this.undoOrRedo = this.undoOrRedo.bind( this );
	}

	undoOrRedo( event ) {
		const { onRedo, onUndo } = this.props;

		if ( event.shiftKey ) {
			onRedo();
		} else {
			onUndo();
		}

		event.preventDefault();
	}

	render() {
		return (
			<>
				<BlockEditorKeyboardShortcuts />
				<KeyboardShortcuts
					shortcuts={ {
						[ rawShortcut.primary( 'z' ) ]: this.undoOrRedo,
						[ rawShortcut.primaryShift( 'z' ) ]: this.undoOrRedo,
					} }
				/>
				<SaveShortcut />
			</>
		);
	}
}

const EnhancedVisualEditorGlobalKeyboardShortcuts = withDispatch( ( dispatch ) => {
	const {
		redo,
		undo,
	} = dispatch( 'core/editor' );

	return {
		onRedo: redo,
		onUndo: undo,
	};
} )( VisualEditorGlobalKeyboardShortcuts );

export default EnhancedVisualEditorGlobalKeyboardShortcuts;

export function EditorGlobalKeyboardShortcuts() {
	deprecated( 'EditorGlobalKeyboardShortcuts', {
		alternative: 'VisualEditorGlobalKeyboardShortcuts',
		plugin: 'Gutenberg',
	} );

	return <EnhancedVisualEditorGlobalKeyboardShortcuts />;
}
