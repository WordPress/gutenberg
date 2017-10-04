/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { IconButton, Popover } from '@wordpress/components';
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';
import { getEditorMode } from '../../selectors';

/**
 * Set of available mode options.
 *
 * @type {Array}
 */
const MODES = [
	{
		value: 'visual',
		label: __( 'Switch To Visual Mode' ),
		icon: 'screenoptions',
	},
	{
		value: 'text',
		label: __( 'Switch To Text Mode' ),
		icon: 'editor-code',
	},
];

class ModeSwitcher extends Component {
	constructor() {
		super( ...arguments );
		this.toggleMenu = this.toggleMenu.bind( this );
		this.switchTo = this.switchTo.bind( this );
		this.state = {
			opened: false,
		};
	}

	toggleMenu() {
		this.setState( ( state ) => ( { opened: ! state.opened } ) );
	}

	switchTo( value ) {
		return () => {
			this.setState( { opened: false } );
			this.props.onSwitch( value );
		};
	}

	render() {
		const { mode } = this.props;
		const { opened } = this.state;

		return (
			<div className="editor-mode-switcher">
				<IconButton
					icon="ellipsis"
					label={ __( 'More' ) }
					onClick={ this.toggleMenu }
				/>
				<Popover isOpen={ opened } position="bottom left">
					{ MODES
						.filter( ( { value } ) => value !== mode )
						.map( ( { value, label, icon } ) => (
							<IconButton
								className="editor-mode-switcher__button"
								key={ value }
								icon={ icon }
								onClick={ this.switchTo( value ) }
							>
								{ label }
							</IconButton>
						) )
					}
				</Popover>
			</div>
		);
	}
}

export default connect(
	( state ) => ( {
		mode: getEditorMode( state ),
	} ),
	( dispatch ) => ( {
		onSwitch( mode ) {
			dispatch( {
				type: 'SWITCH_MODE',
				mode: mode,
			} );
		},
	} )
)( ModeSwitcher );
