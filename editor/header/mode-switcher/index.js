/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { IconButton } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import { getEditorMode } from '../../state/selectors';

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

function ModeSwitcher( { onSwitch, mode } ) {
	return MODES
		.filter( ( { value } ) => value !== mode )
		.map( ( { value, label, icon } ) => (
			<IconButton
				className="editor-mode-switcher__button"
				key={ value }
				icon={ icon }
				onClick={ () => {
					onSwitch( value );
				} }
			>
				{ label }
			</IconButton>
		) );
}

export default connect(
	( state ) => ( {
		mode: getEditorMode( state ),
	} ),
	( dispatch, ownProps ) => ( {
		onSwitch( mode ) {
			dispatch( {
				type: 'SWITCH_MODE',
				mode: mode,
			} );
			ownProps.onSwitch( mode );
		},
	} )
)( ModeSwitcher );
