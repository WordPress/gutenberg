/**
 * Defines extensibility slot for pre-publish sidebar.
 *
 * Defines slot to be used by plugins to insert content in the pre-publish sidebar
 * (which appears when a user pushes "Publish" from the main editor).
 *
 * @file   This files defines the PluginPrePublishPanel extension
 * @since  2.7.0
 */

/**
 * Internal dependencies
 */
import { createSlotFill } from '../../../components/slot-fill';

export default createSlotFill( 'PluginPrePublishPanel' );
