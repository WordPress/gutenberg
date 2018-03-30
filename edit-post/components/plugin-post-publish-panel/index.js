/**
 * Defines extensibility slot for post-publish sidebar.
 *
 * Defines slot to be used by plugins to insert content in the post-publish sidebar
 * (which appears after a user fully publishes a post).
 *
 * @file   This files defines the PluginPostPublishPanel extension
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
const SLOT_NAME = 'PluginPostPublishPanel';

/**
 * Renders the plugin sidebar fill.
 *
 * @return {WPElement} Plugin sidebar fill.
 */
function PluginPostPublishPanel( { children } ) {
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
PluginPostPublishPanel.Slot = () => (
	<Slot name={ SLOT_NAME } />
);

export default PluginPostPublishPanel;
