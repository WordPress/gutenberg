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
import { getEditorMode } from '../../../store/selectors';

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
				'mod+shift+alt+m': this.toggleMode,
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
				dispatch( {
					type: 'SWITCH_MODE', mode: mode,
				} );
			},
		};
	},

)( EditorModeKeyboardShortcuts );
