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
import shortcuts from '../../../keyboard-shortcuts';
import { getEditorMode } from '../../../store/selectors';
import { switchEditorMode } from '../../../store/actions';

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
	const choices = MODES.map( choice => {
		if ( choice.value !== mode ) {
			return { ...choice, shortcut: shortcuts.toggleEditorMode.label };
		}
		return choice;
	} );

	return (
		<MenuItemsGroup
			label={ __( 'Editor' ) }
			choices={ choices }
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
			dispatch( switchEditorMode( mode ) );
			ownProps.onSelect( mode );
		},
	} ),
	undefined,
	{ storeKey: 'edit-post' }
)( ModeSwitcher );
