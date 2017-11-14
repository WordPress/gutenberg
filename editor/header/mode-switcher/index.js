/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ChoiceMenu } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getEditorMode } from '../../selectors';

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
		label: __( 'HTML Editor' ),
	},
];

function ModeSwitcher( { onSwitch, mode } ) {
	return (
		<ChoiceMenu
			label={ __( 'Editor' ) }
			choices={ MODES }
			value={ mode }
			onSelect={ onSwitch }
		/>
	);
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
