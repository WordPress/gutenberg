/**
 * Defines extensibility slot for pre-publish sidebar.
 *
 * Defines slot to be used by plugins to insert content in the pre-publish sidebar
 * (which appears when a user pushes "Publish" from the main editor).
 *
 * @file   This files defines the PluginPrePublishPanel extension
 * @since  2.6.0
 */

/**
 * WordPress dependencies
 */
import { Slot, Fill } from '@wordpress/components';

/**
 * Internal dependencies
 */

/**
 * Name of slot to fill.
 *
 * @type {String}
 */
const SLOT_NAME = 'PluginPrePublishPanel';

/**
 * Renders the plugin sidebar fill.
 *
 * @return {WPElement} Plugin sidebar fill.
 */
function PluginPrePublishPanel( { children } ) {
	return (
		<Fill name={ SLOT_NAME } >
			{ children }
		</Fill>
	);
}

/**
 * The plugin sidebar slot.
 *
 * @return {WPElement} The plugin sidebar slot.
 */
PluginPrePublishPanel.Slot = () => (
	<Slot name={ SLOT_NAME } />
);

export default PluginPrePublishPanel;
