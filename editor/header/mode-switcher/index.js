/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import './style.scss';

class ModeSwitcher extends wp.element.Component {
	constructor() {
		super( ...arguments );
		this.state = {
			value: this.props.mode
		};

		this.switchMode = this.switchMode.bind( this );
	}

	switchMode( mode ) {
		this.setState( { value: mode.target.value } );
		this.props.onSwitch( mode.target.value );
	}

	render() {
		const modes = [
			{ value: 'visual', label: wp.i18n.__( 'Visual' ) },
			{ value: 'text', label: wp.i18n._x( 'Text', 'Name for the Text editor tab (formerly HTML)' ) },
		];
		//const currentMode = modes.find( ( { value } ) => value === this.props.mode );

		return (
			<div className="editor-mode-switcher">
				<select value={ this.state.value } onChange={ this.switchMode }>
					{ modes.map( ( mode ) =>
						<option key={ mode.value } value={ mode.value }>
							{ mode.label }
						</option>
					) }
				</select>
			</div>
		);
	}
}

export default connect(
	( state ) => ( {
		mode: state.mode
	} ),
	( dispatch ) => ( {
		onSwitch( mode ) {
			dispatch( {
				type: 'SWITCH_MODE',
				mode: mode
			} );
		}
	} )
)( ModeSwitcher );
