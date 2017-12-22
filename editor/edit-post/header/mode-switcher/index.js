/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { MenuItemsGroup } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getEditorMode } from '../../../store/selectors';

/**
 * Set of available mode options.
 *
 * @type {Array}
 */
const MODES = [
	{
		value: 'visual',
		label: __( 'Visual Editor' ),
	},
	{
		value: 'text',
		label: __( 'Code Editor' ),
	},
];

function ModeSwitcher( { onSwitch, mode } ) {
	const filteredModes = MODES.map( MODE => {
		if ( MODE.value !== mode ) {
			return { ...MODE, shortcut: 'toggle_editor_mode' };
		}
		return MODE;
	} );

	return (
		<MenuItemsGroup
			label={ __( 'Editor' ) }
			choices={ filteredModes }
			value={ mode }
			onSelect={ onSwitch }
		/>
	);
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
			ownProps.onSelect( mode );
		},
	} )
)( ModeSwitcher );
