/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getSidebars, activateSidebar } from '../../../api/sidebar';
import { MenuItemsGroup } from '../../../../components';
import { getActivePanel, isEditorSidebarOpened } from '../../../store/selectors';
import { connect } from 'react-redux';
import { toggleSidebar } from '../../../store/actions';

/**
 * Renders a list of plugins that will activate different UI elements.
 *
 * @param {Object}   props Props.
 * @param {Function} props.onSwitch        Function to call when a plugin is
 *                                         switched to.
 * @param {string}   props.activePanel     The currently active panel.
 * @param {boolean}  props.isSidebarOpened Whether the sidebar is currently open.
 * @param {Function} props.onToggleSidebar Function to call when the sidebar
 *                                         should be toggled.
 *
 * @returns {Object} The rendered list of menu items.
 */
function Plugins( { activePanel, onSwitch, isSidebarOpened, onToggleSidebar } ) {
	const sidebars = getSidebars();

	// This makes sure no check mark is before a plugin if the sidebar is closed.
	if ( ! isSidebarOpened ) {
		activePanel = '';
	}

	/**
	 * Handles the user clicking on one of the plugins in the menu
	 *
	 * @param {string} panelToActivate The sidebar panel to activate.
	 */
	function onSelect( panelToActivate ) {
		onSwitch( panelToActivate );

		if ( ! isSidebarOpened ) {
			onToggleSidebar();
		}
	}

	const plugins = map( sidebars, ( sidebar ) => {
		return {
			value: sidebar.name,
			label: sidebar.title,
		};
	} );

	return (
		<MenuItemsGroup
			label={ __( 'Plugins' ) }
			choices={ plugins }
			value={ activePanel }
			onSelect={ onSelect }
		/>
	);
}

export default connect(
	( state ) => {
		return {
			activePanel: getActivePanel( state ),
			isSidebarOpened: isEditorSidebarOpened( state ),
		};
	},
	( dispatch, ownProps ) => {
		return {
			onSwitch: ( value ) => {
				activateSidebar( value );
				ownProps.onToggle( value );
			},
			onToggleSidebar: () => {
				dispatch( toggleSidebar() );
			},
		};
	}
)( Plugins );
