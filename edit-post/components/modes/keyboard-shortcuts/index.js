/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { KeyboardShortcuts } from '@wordpress/components';

/**
 * Internal dependencies
 */
import shortcuts from '../../../keyboard-shortcuts';
import { getEditorMode } from '../../../store/selectors';
import { switchEditorMode } from '../../../store/actions';

class EditorModeKeyboardShortcuts extends Component {
	constructor() {
		super( ...arguments );

		this.toggleMode = this.toggleMode.bind( this );
	}

	toggleMode() {
		const { mode, switchMode } = this.props;
		switchMode( mode === 'visual' ? 'text' : 'visual' );
	}

	render() {
		return (
			<KeyboardShortcuts shortcuts={ {
				[ shortcuts.toggleEditorMode.value ]: this.toggleMode,
			} } />
		);
	}
}

export default connect(
	( state ) => {
		return {
			mode: getEditorMode( state ),
		};
	},
	( dispatch ) => {
		return {
			switchMode: ( mode ) => {
				dispatch( switchEditorMode( mode ) );
			},
		};
	},
	undefined,
	{ storeKey: 'edit-post' }
)( EditorModeKeyboardShortcuts );
